import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

type ProblemWithStats = {
  id: string
  question: string
  answer: string
  keywords: string[]
  images: string[]
  categoryId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  category: { id: string; name: string; color: string; userId: string; createdAt: Date } | null
  mistakeNote: {
    id: string
    problemId: string
    userId: string
    skipCount: number
    blurryCount: number
    vividCount: number
    lastStudiedAt: Date | null
    createdAt: Date
    updatedAt: Date
  } | null
  retrievalRate: number | null
  totalCount: number
  lastStudiedAt: Date | null
}

function withStats(problems: Awaited<ReturnType<typeof fetchProblems>>): ProblemWithStats[] {
  return problems.map((p) => {
    const note = p.mistakeNote
    const total = note ? note.skipCount + note.blurryCount + note.vividCount : 0
    const rate = total > 0 ? Math.round(((note?.vividCount ?? 0) / total) * 100) : null
    return {
      ...p,
      retrievalRate: rate,
      totalCount: total,
      lastStudiedAt: note?.lastStudiedAt ?? null,
    }
  })
}

const SORT_FIELDS = ["createdAt", "vividCount", "lastStudiedAt", "retrievalRate"] as const
type SortField = (typeof SORT_FIELDS)[number]

function buildOrderBy(sort: SortField, order: "asc" | "desc"): Prisma.ProblemOrderByWithRelationInput[] {
  const tie: Prisma.ProblemOrderByWithRelationInput = { createdAt: "desc" }
  if (sort === "createdAt") return [{ createdAt: order }, { id: "desc" }]
  if (sort === "vividCount") {
    return [{ mistakeNote: { vividCount: order } }, tie, { id: "desc" }]
  }
  if (sort === "retrievalRate") {
    return [{ retrievalRate: order }, tie, { id: "desc" }]
  }
  return [
    { mistakeNote: { lastStudiedAt: { sort: order, nulls: "last" } } },
    tie,
    { id: "desc" },
  ]
}

async function fetchProblems(
  userId: string,
  args: {
    categoryId: string | null
    search: string | null
    orderBy: Prisma.ProblemOrderByWithRelationInput[]
    skip?: number
    take?: number
  }
) {
  const where: Prisma.ProblemWhereInput = {
    userId,
    ...(args.categoryId && { categoryId: args.categoryId }),
    ...(args.search && {
      OR: [
        { question: { contains: args.search, mode: "insensitive" } },
        { answer: { contains: args.search, mode: "insensitive" } },
        { keywords: { has: args.search } },
      ],
    }),
  }
  return prisma.problem.findMany({
    where,
    include: { category: true, mistakeNote: true },
    orderBy: args.orderBy,
    ...(args.skip !== undefined && { skip: args.skip }),
    ...(args.take !== undefined && { take: args.take }),
  })
}

async function countProblems(userId: string, categoryId: string | null, search: string | null) {
  return prisma.problem.count({
    where: {
      userId,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { question: { contains: search, mode: "insensitive" } },
          { answer: { contains: search, mode: "insensitive" } },
          { keywords: { has: search } },
        ],
      }),
    },
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  const priority = searchParams.get("priority") === "true"
  const search = searchParams.get("search")?.trim() || null
  const sortRaw = searchParams.get("sort")
  const orderRaw = searchParams.get("order")
  const limitRaw = searchParams.get("limit")
  const offsetRaw = searchParams.get("offset")

  const sort: SortField = SORT_FIELDS.includes(sortRaw as SortField) ? (sortRaw as SortField) : "createdAt"
  const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc"

  if (priority) {
    const raw = await fetchProblems(userId, {
      categoryId,
      search: null,
      orderBy: [{ createdAt: "desc" }],
    })
    let problems = withStats(raw)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { retrievalThreshold: true, staleDays: true },
    })
    const threshold = user?.retrievalThreshold ?? 80
    const staleMs = (user?.staleDays ?? 7) * 24 * 60 * 60 * 1000
    const now = Date.now()
    const rank = (p: ProblemWithStats) => {
      const isLowRate = p.retrievalRate !== null && p.retrievalRate < threshold
      const lastTime = p.lastStudiedAt ? new Date(p.lastStudiedAt).getTime() : null
      const isStale = lastTime === null || now - lastTime >= staleMs
      if (isLowRate) return 1
      if (isStale) return 2
      return 3
    }
    problems = [...problems].sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      const aTime = a.lastStudiedAt ? new Date(a.lastStudiedAt).getTime() : 0
      const bTime = b.lastStudiedAt ? new Date(b.lastStudiedAt).getTime() : 0
      return aTime - bTime
    })
    return NextResponse.json(problems)
  }

  const orderBy = buildOrderBy(sort, order)

  if (limitRaw !== null) {
    const limit = Math.max(1, Math.min(100, Number(limitRaw) || 20))
    const offset = Math.max(0, Number(offsetRaw) || 0)
    const [raw, total] = await Promise.all([
      fetchProblems(userId, { categoryId, search, orderBy, skip: offset, take: limit }),
      countProblems(userId, categoryId, search),
    ])
    const items = withStats(raw)
    const nextOffset = offset + items.length < total ? offset + items.length : null
    return NextResponse.json({ items, total, nextOffset })
  }

  const raw = await fetchProblems(userId, { categoryId, search, orderBy })
  return NextResponse.json(withStats(raw))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { question, answer, keywords, categoryId, images } = await req.json()
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 })
  }

  const problem = await prisma.problem.create({
    data: {
      question: question.trim(),
      answer: answer.trim(),
      keywords: Array.isArray(keywords) ? keywords : [],
      images: Array.isArray(images) ? images.filter((u: unknown) => typeof u === "string") : [],
      categoryId: categoryId || null,
      userId,
    },
    include: { category: true },
  })
  return NextResponse.json(problem, { status: 201 })
}
