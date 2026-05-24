import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

export type Suggestion =
  | { text: string; type: "keyword"; count: number }
  | { text: string; type: "problem"; count: number; problemId: string }

type KeywordRow = { keyword: string; count: bigint }

export const GET = withAuth(async (_req, { userId }) => {
  const [keywordRows, problems] = await Promise.all([
    prisma.$queryRaw<KeywordRow[]>`
      SELECT unnest(keywords) AS keyword, COUNT(*) AS count
      FROM "Problem"
      WHERE "userId" = ${userId}
      GROUP BY keyword
      ORDER BY count DESC, keyword ASC
    `,
    prisma.problem.findMany({
      where: { userId },
      select: { id: true, question: true },
    }),
  ])

  // Surface problems as suggestions too, so picking one as a keyword links
  // the two problems directly in the mindmap (title-match logic).
  // Deduplicate against keyword text (case-insensitive, trimmed): if a problem
  // title equals an existing keyword text, prefer the problem suggestion
  // (it carries the problemId) but keep the higher count.
  const norm = (s: string) => s.trim().toLowerCase()
  const byKey = new Map<string, Suggestion>()

  for (const row of keywordRows) {
    const text = row.keyword
    if (!text) continue
    byKey.set(norm(text), { text, type: "keyword", count: Number(row.count) })
  }

  for (const p of problems) {
    const text = p.question.trim()
    if (!text) continue
    const key = norm(text)
    const existing = byKey.get(key)
    byKey.set(key, {
      text,
      type: "problem",
      count: existing?.count ?? 0,
      problemId: p.id,
    })
  }

  const suggestions = Array.from(byKey.values()).sort(
    (a, b) => b.count - a.count || a.text.localeCompare(b.text),
  )
  return NextResponse.json(suggestions)
})
