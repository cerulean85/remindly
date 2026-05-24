import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

type KeywordRow = { keyword: string; count: bigint }

export const GET = withAuth(async (_req, { userId }) => {
  const rows = await prisma.$queryRaw<KeywordRow[]>`
    SELECT unnest(keywords) AS keyword, COUNT(*) AS count
    FROM "Problem"
    WHERE "userId" = ${userId}
    GROUP BY keyword
    ORDER BY count DESC, keyword ASC
  `
  return NextResponse.json(
    rows.map((r) => ({ keyword: r.keyword, count: Number(r.count) })),
  )
})
