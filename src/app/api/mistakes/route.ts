import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")

  const mistakes = await prisma.mistakeNote.findMany({
    where: {
      userId,
      OR: [{ skipCount: { gt: 0 } }, { blurryCount: { gt: 0 } }],
      ...(categoryId && { problem: { categoryId } }),
    },
    orderBy: [
      { skipCount: "desc" },
      { blurryCount: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      problem: { include: { category: true } },
    },
  })
  return NextResponse.json(mistakes)
})
