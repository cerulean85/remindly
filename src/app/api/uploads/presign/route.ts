import { NextResponse } from "next/server"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  buildImageKey,
  getPresignedUploadUrl,
  publicUrlForKey,
} from "@/lib/s3"
import { withAuth } from "@/lib/withAuth"

export const POST = withAuth(async (req, { userId }) => {
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
})
