import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

type RouteCtx = { params: Promise<{ id: string }> }

async function getOwnedProblem(problemId: string, userId: string) {
  return prisma.problem.findFirst({
    where: { id: problemId, userId },
    select: { id: true },
  })
}

export const GET = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id: problemId } = await params

  const problem = await getOwnedProblem(problemId, userId)
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const records = await prisma.mistakeRecord.findMany({
    where: { problemId, userId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(records)
})

export const POST = withAuth<RouteCtx>(async (req, { userId, params }) => {
  const { id: problemId } = await params

  const problem = await getOwnedProblem(problemId, userId)
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { content } = await req.json()
  const trimmedContent = typeof content === "string" ? content.trim() : ""
  if (!trimmedContent) {
    return NextResponse.json({ error: "content is required" }, { status: 400 })
  }

  const record = await prisma.mistakeRecord.create({
    data: { problemId, userId, content: trimmedContent },
  })

  return NextResponse.json(record, { status: 201 })
})
