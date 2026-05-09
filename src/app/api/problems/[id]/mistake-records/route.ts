import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

async function getOwnedProblem(problemId: string, userId: string) {
  return prisma.problem.findFirst({
    where: { id: problemId, userId },
    select: { id: true },
  })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id: problemId } = await params

  const problem = await getOwnedProblem(problemId, userId)
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const records = await prisma.mistakeRecord.findMany({
    where: { problemId, userId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
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
}
