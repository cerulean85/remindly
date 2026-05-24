import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"
import {
  buildMindmapGraph,
  extractSubgraph,
  problemNodeId,
} from "@/lib/mindmap"

export type { ProblemMindmap } from "@/lib/mindmap"

type RouteCtx = { params: Promise<{ id: string }> }

const SUBGRAPH_MAX_HOPS = 2

export const GET = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id } = await params

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

  if (!problems.some((p) => p.id === id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const focusedId = problemNodeId(id)
  const full = buildMindmapGraph(problems)
  const sub = extractSubgraph(full, focusedId, SUBGRAPH_MAX_HOPS)
  return NextResponse.json({ ...sub, focusedId })
})
