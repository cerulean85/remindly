import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json().catch(() => ({}))
  const note = await prisma.note.create({
    data: {
      userId,
      title: typeof body.title === "string" ? body.title : "",
      content: typeof body.content === "string" ? body.content : "",
    },
  })
  return NextResponse.json(note, { status: 201 })
}
