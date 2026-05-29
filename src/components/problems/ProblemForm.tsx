"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { MarkdownPreview } from "@/components/notes/MarkdownPreview"
import { TagInput, type Suggestion } from "./TagInput"
import { uploadImage } from "@/lib/uploadImage"
import { cn } from "@/lib/utils"
import { readInitialDraft, useDraftAutosave } from "@/hooks/useDraftAutosave"
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
  /** If false, skip restoring an existing draft on mount (DB baseline wins).
   *  Writes still happen so users can resume after navigating away. Defaults
   *  to true (suitable for "create" flows). Set false on "edit" so stale
   *  drafts can't shadow the persisted record. */
  restoreDraft?: boolean
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

// A draft is "meaningful" only if any field carries real content. Empty
// drafts can be persisted accidentally (e.g., user opens the form then
// leaves) and would otherwise clobber the DB-backed baseline on next mount.
function hasMeaningfulContent(s: ProblemFormState): boolean {
  return (
    s.question.trim().length > 0 ||
    s.answer.trim().length > 0 ||
    s.keywords.length > 0 ||
    s.images.length > 0 ||
    s.categoryId !== ""
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
  restoreDraft = true,
  onStateChange,
}: ProblemFormProps) {
  const { t } = useTranslation()
  // Baseline is what we compare current state against to compute `isDirty`.
  // Held in state so reads happen during render and updates re-trigger the
  // dirty check on submit.
  const [baseline, setBaseline] = useState<ProblemFormState>(() => buildInitialState(initial))
  // Restore any draft on first render so the initial state already reflects
  // unsaved work. Two gates protect against data loss:
  //   1. `restoreDraft=false` (edit mode) — DB baseline always wins.
  //   2. Empty drafts are ignored so an accidental "opened-and-left"
  //      snapshot can't blank out the baseline.
  const [initialValues] = useState<ProblemFormState>(() => {
    if (!restoreDraft) return baseline
    const draft = readInitialDraft<ProblemFormState>(autosaveKey ?? null)
    if (!draft || !hasMeaningfulContent(draft)) return baseline
    if (sameState(draft, baseline)) return baseline
    return draft
  })
  const [question, setQuestion] = useState(initialValues.question)
  const [answer, setAnswer] = useState(initialValues.answer)
  const [keywords, setKeywords] = useState<string[]>(initialValues.keywords)
  const [categoryId, setCategoryId] = useState<string>(initialValues.categoryId)
  const [images, setImages] = useState<string[]>(initialValues.images)
  const [answerView, setAnswerView] = useState<"write" | "preview">("write")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: keywordSuggestions = [] } = useQuery<Suggestion[]>({
    queryKey: ["keywords"],
    queryFn: () => fetch("/api/keywords").then((r) => r.json()),
    staleTime: 60_000,
  })

  const currentState: ProblemFormState = { question, answer, keywords, categoryId, images }

  const { clear: clearDraft } = useDraftAutosave<ProblemFormState>(
    autosaveKey ?? null,
    currentState,
    { debounceMs: 800 },
  )

  const isDirty = !sameState(currentState, baseline)
  const isValid = question.trim().length > 0 && answer.trim().length > 0
  useEffect(() => {
    onStateChange?.({ isDirty, isValid, isUploading: uploading })
  }, [isDirty, isValid, uploading, onStateChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploading) return
    await onSubmit({ question, answer, keywords, categoryId: categoryId || null, images })
    clearDraft()
    setBaseline(currentState)
  }

  const handleFiles = async (files: FileList | File[] | null | undefined) => {
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

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items ?? [])
    const imageFiles = items
      .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter((f): f is File => f !== null)
    if (imageFiles.length > 0) {
      e.preventDefault()
      handleFiles(imageFiles)
      return
    }

    // Right-click → copy image from a webpage sometimes ships only the HTML
    // markup (no raw bytes). Pull the first <img src> out and fetch it so
    // the upload pipeline still gets a real File. CORS can block this; we
    // surface the failure rather than silently dropping the paste.
    const html = e.clipboardData?.getData("text/html") ?? ""
    const url = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1]
    if (!url) return

    e.preventDefault()
    setUploadError(null)
    setUploading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`)
      const blob = await res.blob()
      if (!blob.type.startsWith("image/")) throw new Error("Clipboard did not contain an image")
      const ext = blob.type.split("/")[1] || "png"
      const file = new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type })
      const uploadedUrl = await uploadImage(file)
      setImages((prev) => [...prev, uploadedUrl])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {t("problems.question")} *
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onPaste={handlePaste}
          required
          rows={3}
          className="w-full rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-text-secondary">
            {t("problems.answer")} *
          </label>
          <div className="flex rounded-lg border border-border-default overflow-hidden text-xs">
            {(["write", "preview"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setAnswerView(view)}
                className={cn(
                  "px-2.5 py-1 transition-colors",
                  answerView === view
                    ? "bg-emerald-500 text-white"
                    : "text-text-secondary hover:bg-black/[0.04] dark:hover:bg-surface-elevated/[0.06]"
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
            onPaste={handlePaste}
            required
            rows={14}
            placeholder="Markdown"
            className="w-full rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm font-mono leading-relaxed outline-none focus:ring-2 focus:ring-emerald-400 resize-y min-h-[20rem]"
          />
        ) : (
          <div className="min-h-[20rem] rounded-xl border border-border-default bg-surface-elevated px-3 py-2">
            {answer.trim() ? (
              <MarkdownPreview content={answer} />
            ) : (
              <p className="text-sm text-text-tertiary">미리볼 설명이 없습니다.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium text-text-secondary">
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
              <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-border-default bg-surface-base">
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
          <p className="text-xs text-text-tertiary">{t("problems.imagesHint")}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {t("problems.keywords")}
        </label>
        <TagInput
          value={keywords}
          onChange={setKeywords}
          placeholder={t("problems.keywordsPlaceholder")}
          suggestions={keywordSuggestions}
          excludeProblemId={initial?.id}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {t("problems.category")}
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
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
