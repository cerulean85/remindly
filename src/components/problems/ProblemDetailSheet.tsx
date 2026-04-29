"use client"

import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/Badge"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { ImageGallery } from "@/components/ui/ImageGallery"
import type { Problem } from "@/types"

interface ProblemDetailSheetProps {
  problem: Problem | null
  onClose: () => void
  onEdit?: (p: Problem) => void
  onDelete?: (p: Problem) => void
}

export function ProblemDetailSheet({ problem, onClose, onEdit, onDelete }: ProblemDetailSheetProps) {
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
          className="mx-auto max-w-3xl rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl h-[95dvh] flex flex-col relative"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 h-9 w-9 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-6 pb-8 pt-3 flex flex-col gap-5">
            {/* Category */}
            {problem?.category && (
              <CategoryBadge category={problem.category} />
            )}

            {/* Question */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">주제</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {problem?.question}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* Answer */}
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1.5">설명</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {problem?.answer}
              </p>
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

            {/* Actions */}
            {problem && (onEdit || onDelete) && (
              <div className="flex gap-3 pt-1">
                {onEdit && (
                  <button
                    onClick={() => { onClose(); setTimeout(() => onEdit(problem), 150) }}
                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    수정
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onClose(); setTimeout(() => onDelete(problem), 150) }}
                    className="flex-1 rounded-xl border border-red-200 dark:border-red-900 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
