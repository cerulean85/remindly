export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? ""
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size, ext }),
  })
  if (!presignRes.ok) throw new Error(await presignRes.text())
  const { uploadUrl, publicUrl } = await presignRes.json()

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!putRes.ok) throw new Error("Upload failed")
  return publicUrl as string
}
