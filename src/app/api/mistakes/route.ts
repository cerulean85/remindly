import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  const search = searchParams.get("search")?.trim()

  const records = await prisma.mistakeRecord.findMany({
    where: {
      userId,
      ...(categoryId && { problem: { categoryId } }),
      ...(search && {
        OR: [
          { content: { contains: search, mode: "insensitive" } },
          { problem: { question: { contains: search, mode: "insensitive" } } },
          { problem: { answer: { contains: search, mode: "insensitive" } } },
          { problem: { keywords: { has: search } } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      problem: { include: { category: true } },
    },
  })
  return NextResponse.json(records)
})
