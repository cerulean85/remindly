"use client"

import { useState } from "react"
import type { MistakeNote, Problem } from "@/types"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { Badge } from "@/components/ui/Badge"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface Props {
  mistakes: MistakeNote[]
  onDelete: (problemId: string) => void
}

export function MistakeList({ mistakes, onDelete }: Props) {
  const { t } = useTranslation()
  const [detailTarget, setDetailTarget] = useState<Problem | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-medium">{t("mistakes.noMistakes")}</p>
        <p className="text-sm mt-1">{t("mistakes.noMistakesMessage")}</p>
      </div>
    )
  }

  const handleDeleteClick = (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation()
    setConfirmId(problemId)
  }

  const handleConfirmDelete = () => {
    if (confirmId) {
      onDelete(confirmId)
      setConfirmId(null)
    }
  }

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {mistakes.map((m) => (
          <li key={m.id} className="h-full">
            <div className="h-full flex flex-col w-full text-left rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <button
                className="flex-1 flex flex-col items-start w-full text-left p-4 pb-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                onClick={() => m.problem && setDetailTarget(m.problem)}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{m.problem?.question}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{m.problem?.answer}</p>
                {m.problem && m.problem.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.problem.keywords.slice(0, 3).map((kw) => (
                      <Badge key={kw}>{kw}</Badge>
                    ))}
                    {m.problem.keywords.length > 3 && (
                      <Badge>+{m.problem.keywords.length - 3}</Badge>
                    )}
                  </div>
                )}
              </button>

              <div className="mt-auto flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <CategoryBadge category={m.problem?.category} />
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>⏭ <strong>{m.skipCount}</strong></span>
                  <span>💡 <strong>{m.hintCount}</strong></span>
                  <button
                    onClick={(e) => handleDeleteClick(e, m.problemId)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    {t("mistakes.delete")}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ProblemDetailSheet
        problem={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t("mistakes.deleteConfirm")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t("mistakes.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {t("mistakes.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
