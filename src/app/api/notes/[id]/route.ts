import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

type RouteCtx = { params: Promise<{ id: string }> }

async function getOwned(id: string, userId: string) {
  return prisma.note.findFirst({ where: { id, userId } })
}

export const GET = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id } = await params
  const note = await getOwned(id, userId)
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(note)
})

export const PATCH = withAuth<RouteCtx>(async (req, { userId, params }) => {
  const { id } = await params
  const owned = await getOwned(id, userId)
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
})

export const DELETE = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id } = await params
  const owned = await getOwned(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.note.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
})
