"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { TagInput } from "./TagInput"
import type { Category, Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface ProblemFormProps {
  initial?: Partial<Problem>
  categories: Category[]
  onSubmit: (data: { question: string; answer: string; keywords: string[]; categoryId: string | null; memo: string | null }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ProblemForm({ initial, categories, onSubmit, onCancel, isLoading }: ProblemFormProps) {
  const { t } = useTranslation()
  const [question, setQuestion] = useState(initial?.question ?? "")
  const [answer, setAnswer] = useState(initial?.answer ?? "")
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords ?? [])
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? "")
  const [memo, setMemo] = useState(initial?.memo ?? "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ question, answer, keywords, categoryId: categoryId || null, memo: memo.trim() || null })
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
          rows={3}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("problems.memo")}
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={4}
          placeholder={t("problems.memoPlaceholder")}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  )
}
