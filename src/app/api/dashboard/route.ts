import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

type Level = "vivid" | "blurry" | "empty"

type ProblemSummary = {
  id: string
  question: string
  category: { id: string; name: string; color: string } | null
  retrievalRate: number | null
  totalCount: number
  lastStudiedAt: string | null
}

function classify(rate: number | null, total: number, threshold: number): Level {
  if (total === 0) return "empty"
  if (rate === null) return "empty"
  if (rate >= threshold) return "vivid"
  if (rate > 0) return "blurry"
  return "empty"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const [user, problems] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { retrievalThreshold: true, staleDays: true },
    }),
    prisma.problem.findMany({
      where: { userId },
      include: { category: true, mistakeNote: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const threshold = user?.retrievalThreshold ?? 80
  const staleMs = (user?.staleDays ?? 7) * 24 * 60 * 60 * 1000
  const now = Date.now()

  const byLevel: Record<Level, ProblemSummary[]> = { vivid: [], blurry: [], empty: [] }
  const enriched = problems.map((p) => {
    const note = p.mistakeNote
    const total = note ? note.skipCount + note.blurryCount + note.vividCount : 0
    const rate = total > 0 ? Math.round(((note?.vividCount ?? 0) / total) * 100) : null
    const level = classify(rate, total, threshold)
    const summary: ProblemSummary = {
      id: p.id,
      question: p.question,
      category: p.category ? { id: p.category.id, name: p.category.name, color: p.category.color } : null,
      retrievalRate: rate,
      totalCount: total,
      lastStudiedAt: note?.lastStudiedAt ? note.lastStudiedAt.toISOString() : null,
    }
    byLevel[level].push(summary)
    return { ...summary, level, lastStudiedTime: note?.lastStudiedAt ? note.lastStudiedAt.getTime() : null }
  })

  const totalProblems = problems.length
  const overallRate = totalProblems > 0 ? Math.round((byLevel.vivid.length / totalProblems) * 100) : 0

  const rank = (p: { retrievalRate: number | null; lastStudiedTime: number | null }) => {
    const isLowRate = p.retrievalRate !== null && p.retrievalRate < threshold
    const isStale = p.lastStudiedTime === null || now - p.lastStudiedTime >= staleMs
    if (isLowRate) return 1
    if (isStale) return 2
    return 3
  }

  const priority = [...enriched]
    .sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      const at = a.lastStudiedTime ?? 0
      const bt = b.lastStudiedTime ?? 0
      return at - bt
    })
    .slice(0, 5)
    .map((p): ProblemSummary => ({
      id: p.id,
      question: p.question,
      category: p.category,
      retrievalRate: p.retrievalRate,
      totalCount: p.totalCount,
      lastStudiedAt: p.lastStudiedAt,
    }))

  return NextResponse.json({
    settings: { retrievalThreshold: threshold, staleDays: user?.staleDays ?? 7 },
    summary: {
      totalProblems,
      vividCount: byLevel.vivid.length,
      blurryCount: byLevel.blurry.length,
      emptyCount: byLevel.empty.length,
      overallRate,
    },
    byLevel,
    priority,
  })
}
