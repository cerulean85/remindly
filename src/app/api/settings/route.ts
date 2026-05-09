import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

export const GET = withAuth(async (_req, { userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { retrievalThreshold: true, staleDays: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
})

export const PATCH = withAuth(async (req, { userId }) => {
  const body = await req.json()
  const updates: { retrievalThreshold?: number; staleDays?: number } = {}

  if (body.retrievalThreshold !== undefined) {
    const value = Number(body.retrievalThreshold)
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return NextResponse.json({ error: "retrievalThreshold must be 0-100" }, { status: 400 })
    }
    updates.retrievalThreshold = Math.round(value)
  }

  if (body.staleDays !== undefined) {
    const value = Number(body.staleDays)
    if (!Number.isFinite(value) || value < 1 || value > 365) {
      return NextResponse.json({ error: "staleDays must be 1-365" }, { status: 400 })
    }
    updates.staleDays = Math.round(value)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: { retrievalThreshold: true, staleDays: true },
  })
  return NextResponse.json(user)
})
