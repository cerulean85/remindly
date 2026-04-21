import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ problemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { problemId } = await params

  const problem = await prisma.problem.findFirst({ where: { id: problemId, userId } })
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { action } = await req.json()
  if (action !== "skip" && action !== "hint") {
    return NextResponse.json({ error: "action must be 'skip' or 'hint'" }, { status: 400 })
  }

  const field = action === "skip" ? "skipCount" : "hintCount"

  const note = await prisma.mistakeNote.upsert({
    where: { problemId },
    update: { [field]: { increment: 1 } },
    create: { problemId, userId, [field]: 1 },
  })
  return NextResponse.json(note)
}
