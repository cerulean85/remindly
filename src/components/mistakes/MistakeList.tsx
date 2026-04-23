"use client"

import { useState } from "react"
import type { MistakeNote, Problem } from "@/types"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
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
      <ul className="flex flex-col gap-3">
        {mistakes.map((m) => (
          <li key={m.id}>
            <div className="w-full text-left rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
              <button
                className="w-full text-left"
                onClick={() => m.problem && setDetailTarget(m.problem)}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
                    {m.problem?.question}
                  </p>
                  <CategoryBadge category={m.problem?.category} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{m.problem?.answer}</p>
              </button>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>⏭ {t("mistakes.skipCount")}: <strong>{m.skipCount}</strong></span>
                  <span>💡 {t("mistakes.hintCount")}: <strong>{m.hintCount}</strong></span>
                </div>
                <button
                  onClick={(e) => handleDeleteClick(e, m.problemId)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label={t("mistakes.delete")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
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
