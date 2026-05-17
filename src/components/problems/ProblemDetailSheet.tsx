"use client"

import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/Badge"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { MarkdownPreview } from "@/components/notes/MarkdownPreview"
import { ImageGallery } from "@/components/ui/ImageGallery"
import type { Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface ProblemDetailSheetProps {
  problem: Problem | null
  onClose: () => void
  onEdit?: (p: Problem) => void
  onDelete?: (p: Problem) => void
}

export function ProblemDetailSheet({ problem, onClose, onEdit, onDelete }: ProblemDetailSheetProps) {
  const { t } = useTranslation()
  const open = !!problem
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={onClose}
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-auto max-w-3xl rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl h-[95dvh] flex flex-col"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-neutral-700" />
          </div>

          {/* Header: title + actions */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-neutral-800 px-6 py-3 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("problems.detail")}
            </h2>
            <div className="flex items-center gap-2">
              {problem && onEdit && (
                <button
                  type="button"
                  onClick={() => { onClose(); setTimeout(() => onEdit(problem), 150) }}
                  className="rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  수정
                </button>
              )}
              {problem && onDelete && (
                <button
                  type="button"
                  onClick={() => { onClose(); setTimeout(() => onDelete(problem), 150) }}
                  className="rounded-lg border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="h-8 w-8 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-6 pb-8 pt-4 flex flex-col gap-5">
            {/* Category */}
            {problem?.category && (
              <div>
                <CategoryBadge category={problem.category} />
              </div>
            )}

            {/* Question */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">주제</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {problem?.question}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-neutral-800" />

            {/* Answer */}
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">설명</p>
              {problem?.answer && (
                <MarkdownPreview
                  content={problem.answer}
                  className="text-sm text-gray-800 dark:text-gray-200"
                />
              )}
              {problem && problem.images.length > 0 && (
                <div className="mt-4">
                  <ImageGallery images={problem.images} size="inline" />
                </div>
              )}
            </div>

            {/* Keywords */}
            {problem && problem.keywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">키워드</p>
                <div className="flex flex-wrap gap-1.5">
                  {problem.keywords.map((kw) => (
                    <Badge key={kw}>{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
