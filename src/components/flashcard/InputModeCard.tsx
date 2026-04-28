"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { ImageGallery } from "@/components/ui/ImageGallery"
import { cn } from "@/lib/utils"
import type { Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

interface InputModeCardProps {
  problem: Problem
  onCorrect: () => void
  onWrong: () => void
  onSkip: () => void
}

export function InputModeCard({ problem, onCorrect, onWrong, onSkip }: InputModeCardProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState("")
  const [checked, setChecked] = useState(false)
  const isMatch = normalize(input) === normalize(problem.answer)

  const handleCheck = () => {
    if (!input.trim()) return
    setChecked(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCheck()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Question */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <CategoryBadge category={problem.category} />
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">
          {problem.question}
        </p>
      </div>

      {/* Answer input */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-4 flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("learn.yourAnswer")}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={checked}
          rows={3}
          placeholder={t("learn.yourAnswerPlaceholder")}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none disabled:opacity-60"
        />

        {checked && (
          <div className={cn(
            "rounded-xl border p-4 flex flex-col gap-2",
            isMatch
              ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          )}>
            <p className={cn(
              "text-xs font-semibold",
              isMatch ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
            )}>
              {isMatch ? "✓ " : "✗ "}{t("learn.correctAnswer")}
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {problem.answer}
            </p>
            {problem.images.length > 0 && (
              <div className="mt-2">
                <ImageGallery images={problem.images} size="sm" />
              </div>
            )}
            {problem.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {problem.keywords.map((kw) => <Badge key={kw}>{kw}</Badge>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!checked ? (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onSkip}>
            {t("learn.skip")}
          </Button>
          <Button className="flex-1" onClick={handleCheck} disabled={!input.trim()}>
            {t("learn.checkAnswer")}
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => { setInput(""); setChecked(false); onWrong() }}>
            {t("learn.markWrong")}
          </Button>
          <Button className="flex-1" onClick={() => { setInput(""); setChecked(false); onCorrect() }}>
            {t("learn.markCorrect")}
          </Button>
        </div>
      )}
    </div>
  )
}
