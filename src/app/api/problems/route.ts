import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")

  const problems = await prisma.problem.findMany({
    where: {
      userId,
      ...(categoryId && { categoryId }),
    },
    include: { category: true, mistakeNote: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(problems)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { question, answer, keywords, categoryId, memo } = await req.json()
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 })
  }

  const problem = await prisma.problem.create({
    data: {
      question: question.trim(),
      answer: answer.trim(),
      keywords: Array.isArray(keywords) ? keywords : [],
      categoryId: categoryId || null,
      memo: memo?.trim() || null,
      userId,
    },
    include: { category: true },
  })
  return NextResponse.json(problem, { status: 201 })
}
