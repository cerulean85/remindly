import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

async function getOwned(id: string, userId: string) {
  return prisma.note.findFirst({ where: { id, userId } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const note = await getOwned(id, session.user.id)
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(note)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const owned = await getOwned(id, session.user.id)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const data: { title?: string; content?: string } = {}
  if (typeof body.title === "string") data.title = body.title
  if (typeof body.content === "string") data.content = body.content
  if (Object.keys(data).length === 0) {
    return NextResponse.json(owned)
  }

  const note = await prisma.note.update({ where: { id }, data })
  return NextResponse.json(note)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const owned = await getOwned(id, session.user.id)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.note.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
