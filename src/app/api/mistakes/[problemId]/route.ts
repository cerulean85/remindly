import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ problemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
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
    const total = updated.skipCount + updated.blurryCount + updated.vividCount
    const rate = total > 0 ? Math.round((updated.vividCount / total) * 100) : 0
    const [, finalNote] = await Promise.all([
      tx.problem.update({ where: { id: problemId }, data: { retrievalRate: rate } }),
      tx.mistakeNote.update({ where: { id: updated.id }, data: { retrievalRate: rate } }),
    ])
    return finalNote
  })

  return NextResponse.json(note)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ problemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { problemId } = await params

  const note = await prisma.mistakeNote.findFirst({ where: { problemId, userId } })
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.mistakeNote.delete({ where: { id: note.id } })
  return NextResponse.json({ success: true })
}
