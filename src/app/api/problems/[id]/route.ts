import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

async function getOwnedProblem(id: string, userId: string) {
  return prisma.problem.findFirst({ where: { id, userId } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const problem = await prisma.problem.findFirst({
    where: { id, userId },
    include: { category: true, mistakeNote: true },
  })
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(problem)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const owned = await getOwnedProblem(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const { question, answer, keywords, categoryId, memo } = await req.json()
    const problem = await prisma.problem.update({
      where: { id },
      data: {
        ...(question?.trim() && { question: question.trim() }),
        ...(answer?.trim() && { answer: answer.trim() }),
        ...(Array.isArray(keywords) && { keywords }),
        categoryId: categoryId !== undefined ? categoryId || null : undefined,
        memo: memo !== undefined ? memo?.trim() || null : undefined,
      },
      include: { category: true },
    })
    return NextResponse.json(problem)
  } catch (e) {
    console.error("PATCH /api/problems/[id]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const owned = await getOwnedProblem(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.problem.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
