import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

type RouteCtx = { params: Promise<{ id: string }> }

async function getOwnedCategory(id: string, userId: string) {
  return prisma.category.findFirst({ where: { id, userId } })
}

export const PATCH = withAuth<RouteCtx>(async (req, { userId, params }) => {
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
})

export const DELETE = withAuth<RouteCtx>(async (_req, { userId, params }) => {
  const { id } = await params
  const owned = await getOwnedCategory(id, userId)
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.category.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
})
