import { prisma } from "@/lib/prisma"
import { retrievalStats } from "@/lib/stats"
import { progressCount } from "@/lib/learningStages"
import { LEARNING_STAGE_KEYS } from "@/types"
import { withAuth } from "@/lib/withAuth"
import type { Prisma } from "@prisma/client"

const TOTAL_STAGES = LEARNING_STAGE_KEYS.length

const COLUMNS = [
  "카테고리",
  "주제",
  "설명",
  "키워드",
  "인출성공률",
  "학습 횟수",
  "오답 기록 수",
  "학습 단계",
  "마지막 학습일",
  "생성일",
] as const

// Excel reads a field as multiple columns when it contains a comma, and breaks
// a row when it contains a newline or quote unless the whole field is quoted
// and inner quotes are doubled. Always quote to keep multi-line answers intact.
function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

function formatDate(date: Date | null): string {
  if (!date) return ""
  // YYYY-MM-DD in local-ish ISO form; good enough for offline review.
  return date.toISOString().slice(0, 10)
}

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  const search = searchParams.get("search")?.trim() || null

  const where: Prisma.ProblemWhereInput = {
    userId,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { question: { contains: search, mode: "insensitive" } },
        { answer: { contains: search, mode: "insensitive" } },
        { keywords: { has: search } },
      ],
    }),
  }

  const problems = await prisma.problem.findMany({
    where,
    include: { category: true, mistakeNote: true, _count: { select: { mistakeRecords: true } } },
    orderBy: [{ category: { name: "asc" } }, { createdAt: "asc" }],
  })

  const rows = problems.map((p) => {
    const { total, rate } = retrievalStats(p.mistakeNote)
    return [
      csvCell(p.category?.name ?? ""),
      csvCell(p.question),
      csvCell(p.answer),
      csvCell(p.keywords.join(", ")),
      csvCell(rate === null ? "" : `${rate}%`),
      csvCell(total),
      csvCell(p._count.mistakeRecords),
      csvCell(`${progressCount(p)}/${TOTAL_STAGES}`),
      csvCell(formatDate(p.mistakeNote?.lastStudiedAt ?? null)),
      csvCell(formatDate(p.createdAt)),
    ].join(",")
  })

  const header = COLUMNS.map(csvCell).join(",")
  // UTF-8 BOM (﻿) so Excel opens Korean text without mojibake.
  const csv = "﻿" + [header, ...rows].join("\r\n") + "\r\n"

  const today = new Date().toISOString().slice(0, 10)
  const filename = `remindly_topics_${today}.csv`
  const encodedFilename = encodeURIComponent(`주제관리_${today}.csv`)

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  })
})
