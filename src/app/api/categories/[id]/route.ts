import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

async function getOwnedCategory(id: string, userId: string) {
  const category = await prisma.category.findFirst({ where: { id, userId } })
  return category
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const owned = await getOwnedCategory(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, color } = await req.json()
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(color && { color }),
    },
  })
  return NextResponse.json(category)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const owned = await getOwnedCategory(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.category.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
