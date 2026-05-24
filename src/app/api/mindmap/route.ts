import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"
import { buildMindmapGraph } from "@/lib/mindmap"

export type { MindmapNode, MindmapLink, MindmapData } from "@/lib/mindmap"

export const GET = withAuth(async (_req, { userId }) => {
  const problems = await prisma.problem.findMany({
    where: { userId },
    select: {
      id: true,
      question: true,
      keywords: true,
      categoryId: true,
      category: { select: { color: true } },
    },
  })
  return NextResponse.json(buildMindmapGraph(problems))
})
