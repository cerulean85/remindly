import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

export const GET = withAuth(async (_req, { userId }) => {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { problems: true } } },
  })
  return NextResponse.json(categories)
})

export const POST = withAuth(async (req, { userId }) => {
  const { name, color } = await req.json()
  if (!name?.trim() || !color) {
    return NextResponse.json({ error: "name and color are required" }, { status: 400 })
  }

  try {
    const category = await prisma.category.create({
      data: { name: name.trim(), color, userId },
    })
    return NextResponse.json(category, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
  }
})
