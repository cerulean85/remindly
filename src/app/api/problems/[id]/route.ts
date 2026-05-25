import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteObjectByUrl } from "@/lib/s3"
import { sanitizeStageInput } from "@/lib/learningStages"
import { mirrorKeywords } from "@/lib/mirrorKeywords"
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
    const { question, answer, keywords, categoryId, images, addKeyword, removeKeyword } = body
    const nextImages = Array.isArray(images)
      ? images.filter((u: unknown) => typeof u === "string")
      : undefined

    // Single-keyword add/remove: derive the next keywords array from the
    // current owned record so the client can skip a pre-fetch.
    let effectiveKeywords: string[] | undefined =
      Array.isArray(keywords) ? keywords : undefined
    if (effectiveKeywords === undefined) {
      const norm = (s: string) => s.trim().toLowerCase()
      if (typeof addKeyword === "string" && addKeyword.trim()) {
        const kw = addKeyword.trim()
        if (!owned.keywords.some((k) => norm(k) === norm(kw))) {
          effectiveKeywords = [...owned.keywords, kw]
        }
      } else if (typeof removeKeyword === "string" && removeKeyword.trim()) {
        const target = norm(removeKeyword)
        const next = owned.keywords.filter((k) => norm(k) !== target)
        if (next.length !== owned.keywords.length) effectiveKeywords = next
      }
    }

    const stageData: Partial<Record<(typeof LEARNING_STAGE_KEYS)[number], boolean>> = {}
    for (const key of LEARNING_STAGE_KEYS) {
      if (!(key in body)) continue
      const parsed = sanitizeStageInput(body[key])
      if (parsed !== undefined) stageData[key] = parsed
    }

    const problem = await prisma.$transaction(async (tx) => {
      const updated = await tx.problem.update({
        where: { id },
        data: {
          ...(question?.trim() && { question: question.trim() }),
          ...(answer?.trim() && { answer: answer.trim() }),
          ...(effectiveKeywords && { keywords: effectiveKeywords }),
          ...(nextImages && { images: nextImages }),
          categoryId: categoryId !== undefined ? categoryId || null : undefined,
          ...stageData,
        },
        include: { category: true },
      })

      if (effectiveKeywords) {
        const oldSet = new Set(owned.keywords)
        const newSet = new Set<string>(effectiveKeywords)
        const added = [...newSet].filter((k) => !oldSet.has(k))
        const removedKeywords = [...oldSet].filter((k) => !newSet.has(k))
        if (added.length > 0 || removedKeywords.length > 0) {
          await mirrorKeywords({
            sourceProblemId: updated.id,
            sourceTitle: updated.question,
            userId,
            added,
            removed: removedKeywords,
            tx,
          })
        }
      }

      return updated
    })

    if (nextImages) {
      // S3 deletes happen after the transaction commits — they can't be
      // rolled back if a mirror were to fail, so we run them last.
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
