import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  buildImageKey,
  getPresignedUploadUrl,
  publicUrlForKey,
} from "@/lib/s3"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { contentType, size, ext } = await req.json()

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 })
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 })
  }

  const key = buildImageKey(userId, ext || contentType.split("/")[1] || "bin")
  const uploadUrl = await getPresignedUploadUrl(key, contentType)
  return NextResponse.json({ uploadUrl, publicUrl: publicUrlForKey(key) })
}
