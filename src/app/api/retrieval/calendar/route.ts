import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get("year"))
  const month = Number(searchParams.get("month"))
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "year and month (1-12) required" }, { status: 400 })
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  const logs = await prisma.studyLog.findMany({
    where: { userId, studiedAt: { gte: start, lt: end } },
    orderBy: { studiedAt: "asc" },
    include: { problem: { select: { id: true, question: true, category: true } } },
  })

  type DayBucket = {
    date: string
    vividCount: number
    blurryCount: number
    emptyCount: number
    items: Array<{
      problemId: string
      question: string
      rating: string
      studiedAt: string
      category: { id: string; name: string; color: string } | null
    }>
  }
  const days = new Map<string, DayBucket>()

  for (const log of logs) {
    const d = log.studiedAt
    const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
    let bucket = days.get(dateKey)
    if (!bucket) {
      bucket = { date: dateKey, vividCount: 0, blurryCount: 0, emptyCount: 0, items: [] }
      days.set(dateKey, bucket)
    }
    if (log.rating === "vivid") bucket.vividCount++
    else if (log.rating === "blurry") bucket.blurryCount++
    else bucket.emptyCount++
    bucket.items.push({
      problemId: log.problemId,
      question: log.problem?.question ?? "",
      rating: log.rating,
      studiedAt: log.studiedAt.toISOString(),
      category: log.problem?.category
        ? { id: log.problem.category.id, name: log.problem.category.name, color: log.problem.category.color }
        : null,
    })
  }

  return NextResponse.json({
    year,
    month,
    days: Array.from(days.values()),
  })
}
