import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/authOptions"

type DefaultCtx = { params: Promise<Record<string, never>> }

type AuthedHandler<C> = (
  req: NextRequest,
  ctx: C & { userId: string },
) => Promise<Response> | Response

export function withAuth<C extends { params: Promise<unknown> } = DefaultCtx>(
  handler: AuthedHandler<C>,
) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return handler(req, { ...ctx, userId: session.user.id })
  }
}
