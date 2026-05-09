import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { retrievalRate } from "@/lib/stats"
import { withAuth } from "@/lib/withAuth"

const RATING_TO_FIELD = {
  skip: "skipCount",
  blurry: "blurryCount",
  vivid: "vividCount",
} as const

const RATING_TO_LOG = {
  skip: "empty",
  blurry: "blurry",
  vivid: "vivid",
} as const

type Rating = keyof typeof RATING_TO_FIELD
type RouteCtx = { params: Promise<{ problemId: string }> }

export const PATCH = withAuth<RouteCtx>(async (req, { userId, params }) => {
  const { problemId } = await params

  const problem = await prisma.problem.findFirst({ where: { id: problemId, userId } })
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { action } = await req.json()
  if (!(action in RATING_TO_FIELD)) {
    return NextResponse.json({ error: "action must be 'skip', 'blurry', or 'vivid'" }, { status: 400 })
  }

  const rating = action as Rating
  const field = RATING_TO_FIELD[rating]
  const studiedAt = new Date()

  const note = await prisma.$transaction(async (tx) => {
    await tx.studyLog.create({
      data: { problemId, userId, rating: RATING_TO_LOG[rating], studiedAt },
    })
    const updated = await tx.mistakeNote.upsert({
      where: { problemId },
      update: { [field]: { increment: 1 }, lastStudiedAt: studiedAt },
      create: { problemId, userId, [field]: 1, lastStudiedAt: studiedAt },
    })
    const rate = retrievalRate(updated) ?? 0
    const [, finalNote] = await Promise.all([
      tx.problem.update({ where: { id: problemId }, data: { retrievalRate: rate } }),
      tx.mistakeNote.update({ where: { id: updated.id }, data: { retrievalRate: rate } }),
    ])
    return finalNote
  })

  return NextResponse.json(note)
})

export const DELETE = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { problemId } = await params

  const note = await prisma.mistakeNote.findFirst({ where: { problemId, userId } })
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.mistakeNote.delete({ where: { id: note.id } })
  return NextResponse.json({ success: true })
})
