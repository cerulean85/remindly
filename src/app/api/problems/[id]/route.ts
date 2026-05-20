import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteObjectByUrl } from "@/lib/s3"
import { sanitizeStageInput } from "@/lib/learningStages"
import { withAuth } from "@/lib/withAuth"
import { LEARNING_STAGE_KEYS } from "@/types"

type RouteCtx = { params: Promise<{ id: string }> }

async function getOwnedProblem(id: string, userId: string) {
  return prisma.problem.findFirst({ where: { id, userId } })
}

export const GET = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id } = await params

  const problem = await prisma.problem.findFirst({
    where: { id, userId },
    include: { category: true, mistakeNote: true },
  })
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(problem)
})

export const PATCH = withAuth<RouteCtx>(async (req, { userId, params }) => {
  const { id } = await params
  const owned = await getOwnedProblem(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const { question, answer, keywords, categoryId, images } = body
    const nextImages = Array.isArray(images)
      ? images.filter((u: unknown) => typeof u === "string")
      : undefined

    const stageData: Partial<Record<(typeof LEARNING_STAGE_KEYS)[number], boolean>> = {}
    for (const key of LEARNING_STAGE_KEYS) {
      if (!(key in body)) continue
      const parsed = sanitizeStageInput(body[key])
      if (parsed !== undefined) stageData[key] = parsed
    }

    const problem = await prisma.problem.update({
      where: { id },
      data: {
        ...(question?.trim() && { question: question.trim() }),
        ...(answer?.trim() && { answer: answer.trim() }),
        ...(Array.isArray(keywords) && { keywords }),
        ...(nextImages && { images: nextImages }),
        categoryId: categoryId !== undefined ? categoryId || null : undefined,
        ...stageData,
      },
      include: { category: true },
    })

    if (nextImages) {
      const removed = owned.images.filter((u) => !nextImages.includes(u))
      await Promise.all(removed.map((u) => deleteObjectByUrl(u)))
    }

    return NextResponse.json(problem)
  } catch (e) {
    console.error("PATCH /api/problems/[id]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

export const DELETE = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id } = await params
  const owned = await getOwnedProblem(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.problem.delete({ where: { id } })
  await Promise.all((owned.images || []).map((u) => deleteObjectByUrl(u)))
  return new NextResponse(null, { status: 204 })
})
