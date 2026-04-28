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

  const mistakes = await prisma.mistakeNote.findMany({
    where: {
      userId,
      ...(categoryId && { problem: { categoryId } }),
    },
    orderBy: [
      { skipCount: "desc" },
      { hintCount: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      problem: { include: { category: true } },
    },
  })
  return NextResponse.json(mistakes)
}
