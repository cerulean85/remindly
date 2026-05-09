import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.trim() || null

  const notes = await prisma.note.findMany({
    where: {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  })
  return NextResponse.json(notes)
})

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json().catch(() => ({}))
  const note = await prisma.note.create({
    data: {
      userId,
      title: typeof body.title === "string" ? body.title : "",
      content: typeof body.content === "string" ? body.content : "",
    },
  })
  return NextResponse.json(note, { status: 201 })
})
