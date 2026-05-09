import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

type RouteCtx = { params: Promise<{ id: string }> }

export const PATCH = withAuth<RouteCtx>(async (req, { userId, params }) => {
  const { id } = await params

  const { content } = await req.json()
  const trimmedContent = typeof content === "string" ? content.trim() : ""
  if (!trimmedContent) {
    return NextResponse.json({ error: "content is required" }, { status: 400 })
  }

  const existing = await prisma.mistakeRecord.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const record = await prisma.mistakeRecord.update({
    where: { id },
    data: { content: trimmedContent },
  })

  return NextResponse.json(record)
})

export const DELETE = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id } = await params

  const existing = await prisma.mistakeRecord.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.mistakeRecord.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
