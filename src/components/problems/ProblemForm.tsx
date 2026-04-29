"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { TagInput } from "./TagInput"
import type { Category, Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface ProblemFormProps {
  initial?: Partial<Problem>
  categories: Category[]
  onSubmit: (data: { question: string; answer: string; keywords: string[]; categoryId: string | null; images: string[] }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

async function uploadImage(file: File): Promise<string> {
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
  return publicUrl
}

export function ProblemForm({ initial, categories, onSubmit, onCancel, isLoading }: ProblemFormProps) {
  const { t } = useTranslation()
  const [question, setQuestion] = useState(initial?.question ?? "")
  const [answer, setAnswer] = useState(initial?.answer ?? "")
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords ?? [])
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? "")
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ question, answer, keywords, categoryId: categoryId || null, images })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError(null)
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadImage(file)
        uploaded.push(url)
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("problems.question")} *
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          rows={3}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("problems.answer")} *
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          rows={8}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-y min-h-[10rem]"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("problems.images")}
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium text-indigo-500 hover:text-indigo-600 disabled:opacity-50"
          >
            {uploading ? t("problems.uploading") : `+ ${t("problems.addImage")}`}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadError && (
          <p className="mb-2 text-xs text-red-500">{uploadError}</p>
        )}
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((url) => (
              <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                  aria-label={t("common.delete")}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">{t("problems.imagesHint")}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("problems.keywords")}
        </label>
        <TagInput
          value={keywords}
          onChange={setKeywords}
          placeholder={t("problems.keywordsPlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("problems.category")}
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">{t("problems.noCategory")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading || uploading}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  )
}
