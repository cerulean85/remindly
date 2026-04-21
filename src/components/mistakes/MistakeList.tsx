"use client"

import type { MistakeNote } from "@/types"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export function MistakeList({ mistakes }: { mistakes: MistakeNote[] }) {
  const { t } = useTranslation()

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-medium">{t("mistakes.noMistakes")}</p>
        <p className="text-sm mt-1">{t("mistakes.noMistakesMessage")}</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {mistakes.map((m) => (
        <li
          key={m.id}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
              {m.problem?.question}
            </p>
            <CategoryBadge category={m.problem?.category} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{m.problem?.answer}</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>⏭ {t("mistakes.skipCount")}: <strong>{m.skipCount}</strong></span>
            <span>💡 {t("mistakes.hintCount")}: <strong>{m.hintCount}</strong></span>
          </div>
        </li>
      ))}
    </ul>
  )
}
