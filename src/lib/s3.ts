import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const region = process.env.AWS_REGION!
const bucket = process.env.AWS_S3_BUCKET!
const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function buildImageKey(userId: string, ext: string): string {
  const id = crypto.randomUUID()
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5) || "bin"
  return `problems/${userId}/${id}.${safeExt}`
}

export function publicUrlForKey(key: string): string {
  return `${publicBaseUrl.replace(/\/$/, "")}/${key}`
}

export function keyFromPublicUrl(url: string): string | null {
  const base = publicBaseUrl.replace(/\/$/, "")
  if (!url.startsWith(base + "/")) return null
  return url.slice(base.length + 1)
}

export async function getPresignedUploadUrl(key: string, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(s3, cmd, { expiresIn: 60 })
}

export async function deleteObjectByUrl(url: string): Promise<void> {
  const key = keyFromPublicUrl(url)
  if (!key) return
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {})
}
