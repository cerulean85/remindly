import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

export const DELETE = withAuth(async (_req, { userId }) => {
  await prisma.user.delete({ where: { id: userId } })
  return new NextResponse(null, { status: 204 })
})
