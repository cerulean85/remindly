import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

type Period = "daily" | "weekly" | "monthly"

const BUCKET_COUNT: Record<Period, number> = {
  daily: 14,
  weekly: 12,
  monthly: 12,
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d: Date) {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = (day + 6) % 7
  x.setDate(x.getDate() - diff)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function bucketKey(d: Date, period: Period) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  if (period === "daily") return `${y}-${m}-${day}`
  if (period === "monthly") return `${y}-${m}`
  return `${y}-${m}-${day}`
}

function shiftStart(start: Date, period: Period, n: number) {
  const x = new Date(start)
  if (period === "daily") x.setDate(x.getDate() + n)
  else if (period === "weekly") x.setDate(x.getDate() + n * 7)
  else x.setMonth(x.getMonth() + n)
  return x
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const period = (searchParams.get("period") ?? "daily") as Period
  if (period !== "daily" && period !== "weekly" && period !== "monthly") {
    return NextResponse.json({ error: "period must be daily|weekly|monthly" }, { status: 400 })
  }

  const count = BUCKET_COUNT[period]
  const now = new Date()
  const anchorStart =
    period === "daily" ? startOfDay(now)
    : period === "weekly" ? startOfWeek(now)
    : startOfMonth(now)

  const rangeStart = shiftStart(anchorStart, period, -(count - 1))

  const logs = await prisma.studyLog.findMany({
    where: { userId, studiedAt: { gte: rangeStart } },
    select: { rating: true, studiedAt: true },
  })

  type Bucket = { label: string; vividCount: number; blurryCount: number; emptyCount: number }
  const buckets: Bucket[] = []
  const indexByLabel = new Map<string, number>()

  for (let i = 0; i < count; i++) {
    const start = shiftStart(anchorStart, period, -(count - 1 - i))
    const label = bucketKey(start, period)
    indexByLabel.set(label, i)
    buckets.push({ label, vividCount: 0, blurryCount: 0, emptyCount: 0 })
  }

  for (const log of logs) {
    const start =
      period === "daily" ? startOfDay(log.studiedAt)
      : period === "weekly" ? startOfWeek(log.studiedAt)
      : startOfMonth(log.studiedAt)
    const idx = indexByLabel.get(bucketKey(start, period))
    if (idx === undefined) continue
    if (log.rating === "vivid") buckets[idx].vividCount++
    else if (log.rating === "blurry") buckets[idx].blurryCount++
    else buckets[idx].emptyCount++
  }

  return NextResponse.json({ period, buckets })
}
