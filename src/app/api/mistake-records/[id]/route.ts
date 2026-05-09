import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
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
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const existing = await prisma.mistakeRecord.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.mistakeRecord.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
