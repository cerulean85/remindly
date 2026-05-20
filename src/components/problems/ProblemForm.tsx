"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { MarkdownPreview } from "@/components/notes/MarkdownPreview"
import { TagInput } from "./TagInput"
import { uploadImage } from "@/lib/uploadImage"
import { cn } from "@/lib/utils"
import { useDraftAutosave } from "@/hooks/useDraftAutosave"
import type { Category, Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export type ProblemFormState = {
  question: string
  answer: string
  keywords: string[]
  categoryId: string
  images: string[]
}

interface ProblemFormProps {
  initial?: Partial<Problem>
  categories: Category[]
  onSubmit: (data: {
    question: string
    answer: string
    keywords: string[]
    categoryId: string | null
    images: string[]
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  formId?: string
  hideActions?: boolean
  /** When set, mirrors form state to localStorage under this key. */
  autosaveKey?: string | null
  /** Notified whenever dirty/valid status changes. */
  onStateChange?: (state: { isDirty: boolean; isValid: boolean; isUploading: boolean }) => void
}

function buildInitialState(initial?: Partial<Problem>): ProblemFormState {
  return {
    question: initial?.question ?? "",
    answer: initial?.answer ?? "",
    keywords: initial?.keywords ?? [],
    categoryId: initial?.categoryId ?? "",
    images: initial?.images ?? [],
  }
}

function sameState(a: ProblemFormState, b: ProblemFormState) {
  return (
    a.question === b.question &&
    a.answer === b.answer &&
    a.categoryId === b.categoryId &&
    a.keywords.length === b.keywords.length &&
    a.keywords.every((k, i) => k === b.keywords[i]) &&
    a.images.length === b.images.length &&
    a.images.every((url, i) => url === b.images[i])
  )
}

export function ProblemForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  isLoading,
  formId,
  hideActions,
  autosaveKey,
  onStateChange,
}: ProblemFormProps) {
  const { t } = useTranslation()
  const baselineRef = useRef<ProblemFormState>(buildInitialState(initial))
  const [question, setQuestion] = useState(baselineRef.current.question)
  const [answer, setAnswer] = useState(baselineRef.current.answer)
  const [keywords, setKeywords] = useState<string[]>(baselineRef.current.keywords)
  const [categoryId, setCategoryId] = useState<string>(baselineRef.current.categoryId)
  const [images, setImages] = useState<string[]>(baselineRef.current.images)
  const [answerView, setAnswerView] = useState<"write" | "preview">("write")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentState: ProblemFormState = { question, answer, keywords, categoryId, images }

  const { restored, clear: clearDraft } = useDraftAutosave<ProblemFormState>(
    autosaveKey ?? null,
    currentState,
    { debounceMs: 800 },
  )

  useEffect(() => {
    if (!restored) return
    if (sameState(restored, baselineRef.current)) return
    setQuestion(restored.question)
    setAnswer(restored.answer)
    setKeywords(restored.keywords)
    setCategoryId(restored.categoryId)
    setImages(restored.images)
  }, [restored])

  const isDirty = !sameState(currentState, baselineRef.current)
  const isValid = question.trim().length > 0 && answer.trim().length > 0
  useEffect(() => {
    onStateChange?.({ isDirty, isValid, isUploading: uploading })
  }, [isDirty, isValid, uploading, onStateChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploading) return
    await onSubmit({ question, answer, keywords, categoryId: categoryId || null, images })
    clearDraft()
    baselineRef.current = currentState
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
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("problems.question")} *
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          rows={3}
          className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("problems.answer")} *
          </label>
          <div className="flex rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden text-xs">
            {(["write", "preview"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setAnswerView(view)}
                className={cn(
                  "px-2.5 py-1 transition-colors",
                  answerView === view
                    ? "bg-emerald-500 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                )}
              >
                {view === "write" ? "작성" : "미리보기"}
              </button>
            ))}
          </div>
        </div>
        {answerView === "write" ? (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            rows={14}
            placeholder="Markdown"
            className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono leading-relaxed outline-none focus:ring-2 focus:ring-emerald-400 resize-y min-h-[20rem]"
          />
        ) : (
          <div className="min-h-[20rem] rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2">
            {answer.trim() ? (
              <MarkdownPreview content={answer} />
            ) : (
              <p className="text-sm text-gray-400">미리볼 설명이 없습니다.</p>
            )}
          </div>
        )}
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
            className="text-xs font-medium text-emerald-500 hover:text-emerald-600 disabled:opacity-50"
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
              <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
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
          className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="">{t("problems.noCategory")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {!hideActions && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading || uploading}>
            {t("common.save")}
          </Button>
        </div>
      )}
    </form>
  )
}
