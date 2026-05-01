"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useFlashcard } from "@/hooks/useFlashcard"
import { FlashCard } from "@/components/flashcard/FlashCard"
import { LearningControls } from "@/components/flashcard/LearningControls"
import { InputModeCard } from "@/components/flashcard/InputModeCard"
import { FlashcardSkeleton } from "@/components/ui/Skeleton"
import { Button } from "@/components/ui/Button"
import { LearnIcon, TrophyIcon } from "@/components/ui/Icons"
import { cn } from "@/lib/utils"
import type { Category, Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type LearnMode = "flashcard" | "input"

function ProgressBar({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-500">
      <span>{index + 1} / {total}</span>
      <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

function LearnSession({
  problems,
  mode,
  problemLimit,
  timerSeconds,
}: {
  problems: Problem[]
  mode: LearnMode
  problemLimit: number | null
  timerSeconds: number
}) {
  const { t } = useTranslation()
  const { current, index, total, isFlipped, isComplete, timeLeft, flip, next, prev, restart } = useFlashcard(
    problems,
    { limit: problemLimit, timerSeconds: mode === "flashcard" ? timerSeconds : 0 }
  )

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <LearnIcon className="h-10 w-10 mb-3 text-gray-400" />
        <p className="font-medium">{t("learn.noProblems")}</p>
        <p className="text-sm mt-1">{t("learn.addProblems")}</p>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrophyIcon className="h-10 w-10 mb-3 text-amber-500" />
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t("learn.complete")}</p>
        <p className="text-sm text-gray-500 mb-6">{t("learn.completeMessage")}</p>
        <Button onClick={restart}>다시 시작</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ProgressBar index={index} total={total} />

      {current && mode === "flashcard" && (
        <>
          <FlashCard
            problem={current}
            isFlipped={isFlipped}
            onClick={flip}
            timeLeft={timerSeconds > 0 ? timeLeft : null}
            timerTotal={timerSeconds}
          />
          <LearningControls
            isFlipped={isFlipped}
            hasPrev={index > 0}
            onPrev={prev}
            onFlip={flip}
            onSkip={() => next()}
            onMarkWrong={() => next("skip")}
            onBlurry={() => next("blurry")}
            onKnow={() => next("vivid")}
          />
        </>
      )}

      {current && mode === "input" && (
        <InputModeCard
          key={current.id}
          problem={current}
          onCorrect={() => next("vivid")}
          onWrong={() => next("skip")}
          onSkip={() => next()}
        />
      )}
    </div>
  )
}

const PROBLEM_LIMIT_OPTIONS: (number | null)[] = [10, 20, 50, 100, null]
const TIMER_OPTIONS = [0, 10, 20, 30, 60]

export default function LearnPage() {
  const { t } = useTranslation()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [mode, setMode] = useState<LearnMode>("flashcard")
  const [problemLimit, setProblemLimit] = useState<number | null>(20)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const { data: problems, isLoading } = useQuery<Problem[]>({
    queryKey: ["problems", "priority", selectedCategoryId],
    queryFn: () => {
      const params = new URLSearchParams({ priority: "true" })
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId)
      return fetch(`/api/problems?${params.toString()}`).then((r) => r.json())
    },
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("learn.title")}</h1>
        <div className="ml-auto">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm outline-none"
          >
            <option value="">{t("learn.allMode")}</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}{cat._count !== undefined ? ` (${cat._count.problems})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 flex rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {(["flashcard", "input"] as LearnMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              mode === m
                ? "bg-emerald-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
            )}
          >
            {m === "flashcard" ? t("learn.modeFlashcard") : t("learn.modeInput")}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="shrink-0">{t("learn.problemCount")}</span>
          <select
            value={problemLimit ?? "all"}
            onChange={(e) => setProblemLimit(e.target.value === "all" ? null : Number(e.target.value))}
            className="flex-1 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm outline-none"
          >
            {PROBLEM_LIMIT_OPTIONS.map((v) => (
              <option key={v ?? "all"} value={v ?? "all"}>
                {v === null ? t("learn.allProblems") : v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="shrink-0">{t("learn.timer")}</span>
          <select
            value={timerSeconds}
            onChange={(e) => setTimerSeconds(Number(e.target.value))}
            disabled={mode !== "flashcard"}
            className="flex-1 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm outline-none disabled:opacity-50"
          >
            {TIMER_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === 0 ? t("learn.timerOff") : `${v}${t("learn.secondsSuffix")}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <FlashcardSkeleton />
      ) : (
        <LearnSession
          key={`${mode}-${problemLimit ?? "all"}-${timerSeconds}`}
          problems={problems ?? []}
          mode={mode}
          problemLimit={problemLimit}
          timerSeconds={timerSeconds}
        />
      )}
    </div>
  )
}
