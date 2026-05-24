import { prisma } from "@/lib/prisma"
import type { Prisma, PrismaClient } from "@prisma/client"

const norm = (s: string) => s.trim().toLowerCase()

type PrismaLike = Prisma.TransactionClient | PrismaClient

type Args = {
  sourceProblemId: string
  sourceTitle: string
  userId: string
  added: string[]
  removed: string[]
  /** Pass a transaction client to make the mirror atomic with the source update. */
  tx?: PrismaLike
}

/**
 * Mirror keyword changes onto problems whose title matches the changed
 * keyword text (case-insensitive, trimmed). For each added keyword K, find
 * problems titled K and add the source problem's title to their keywords.
 * For each removed keyword K, do the reverse.
 *
 * Idempotent: skips when the target already has (or doesn't have) the title.
 * Safe from infinite loops: writes via prisma.update bypass the API route
 * handler that triggered the mirror.
 */
export async function mirrorKeywords({
  sourceProblemId,
  sourceTitle,
  userId,
  added,
  removed,
  tx = prisma,
}: Args): Promise<void> {
  const sourceTitleTrimmed = sourceTitle.trim()
  if (!sourceTitleTrimmed) return
  if (added.length === 0 && removed.length === 0) return

  const sourceTitleNorm = norm(sourceTitleTrimmed)
  const textsToMatch = new Set<string>()
  for (const t of added) {
    const k = norm(t)
    if (k) textsToMatch.add(k)
  }
  for (const t of removed) {
    const k = norm(t)
    if (k) textsToMatch.add(k)
  }
  if (textsToMatch.size === 0) return

  const candidates = await tx.problem.findMany({
    where: { userId, NOT: { id: sourceProblemId } },
    select: { id: true, question: true, keywords: true },
  })

  const byTitle = new Map<string, typeof candidates>()
  for (const p of candidates) {
    const k = norm(p.question)
    if (!k || !textsToMatch.has(k)) continue
    const list = byTitle.get(k) ?? []
    list.push(p)
    byTitle.set(k, list)
  }

  const updates: Promise<unknown>[] = []

  for (const text of added) {
    const targets = byTitle.get(norm(text)) ?? []
    for (const target of targets) {
      if (target.keywords.some((k) => norm(k) === sourceTitleNorm)) continue
      updates.push(
        tx.problem.update({
          where: { id: target.id },
          data: { keywords: [...target.keywords, sourceTitleTrimmed] },
        }),
      )
    }
  }

  for (const text of removed) {
    const targets = byTitle.get(norm(text)) ?? []
    for (const target of targets) {
      const next = target.keywords.filter((k) => norm(k) !== sourceTitleNorm)
      if (next.length === target.keywords.length) continue
      updates.push(
        tx.problem.update({
          where: { id: target.id },
          data: { keywords: next },
        }),
      )
    }
  }

  await Promise.all(updates)
}
