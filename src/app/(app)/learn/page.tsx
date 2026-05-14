"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useFlashcard } from "@/hooks/useFlashcard"
import { FlashCard } from "@/components/flashcard/FlashCard"
import { LearningControls } from "@/components/flashcard/LearningControls"
import { FlashcardSkeleton } from "@/components/ui/Skeleton"
import { Button } from "@/components/ui/Button"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { LearnIcon, TrophyIcon } from "@/components/ui/Icons"
import { cn } from "@/lib/utils"
import type { Category, Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

function ProgressBar({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex flex-1 items-center gap-4 text-sm text-gray-500">
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

type LearnMode = "flashcard" | "choice"

function plainText(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[`*_>#-]/g, "")
    .trim()
}

function shuffle<T>(values: T[]) {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function ChoiceCard({
  problem,
  problems,
  onAnswer,
}: {
  problem: Problem
  problems: Problem[]
  onAnswer: (correct: boolean) => void
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const options = useMemo(() => {
    const wrong = shuffle(problems.filter((candidate) => candidate.id !== problem.id)).slice(0, 3)
    return shuffle([problem, ...wrong])
  }, [problem, problems])
  const selected = options.find((option) => option.id === selectedId)
  const isCorrect = selectedId === problem.id
  const answerPreview = plainText(problem.answer)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4">
        <CategoryBadge category={problem.category} />
      </div>
      <p className="mb-5 min-h-20 whitespace-pre-wrap text-center text-lg font-medium text-gray-900 dark:text-gray-100">
        {problem.question}
      </p>
      <div className="grid gap-2">
        {options.map((option) => {
          const picked = selectedId === option.id
          const revealCorrect = selectedId && option.id === problem.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={!!selectedId}
              onClick={() => setSelectedId(option.id)}
              className={cn(
                "min-h-12 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                "border-gray-200 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800",
                picked && !isCorrect && "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
                revealCorrect && "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              )}
            >
              {plainText(option.answer).slice(0, 140) || t("learn.correctAnswer")}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <span className={cn("text-sm font-semibold", isCorrect ? "text-emerald-600" : "text-red-600")}>
              {isCorrect ? t("learn.choiceCorrect") : t("learn.choiceWrong")}
            </span>
            <Button onClick={() => onAnswer(isCorrect)}>{t("learn.next")}</Button>
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t("learn.correctAnswer")}</p>
          <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">
            {answerPreview || t("learn.correctAnswer")}
          </p>
        </div>
      )}
    </div>
  )
}

function LearnSession({
  problems,
  problemLimit,
  timerSeconds,
  storageKey,
  mode,
}: {
  problems: Problem[]
  problemLimit: number | null
  timerSeconds: number
  storageKey: string
  mode: LearnMode
}) {
  const { t } = useTranslation()
  const { current, index, total, isFlipped, isComplete, timeLeft, flip, next, prev, restart } = useFlashcard(
    problems,
    { limit: problemLimit, timerSeconds, storageKey }
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
        <Button onClick={restart}>{t("learn.restart")}</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ProgressBar index={index} total={total} />
        <Button variant="secondary" className="shrink-0 px-3" onClick={restart}>
          {t("learn.restart")}
        </Button>
      </div>

      {current && (
        <>
          {mode === "choice" ? (
            <ChoiceCard
              key={current.id}
              problem={current}
              problems={problems}
              onAnswer={(correct) => next(correct ? "vivid" : "skip")}
            />
          ) : (
            <>
              <LearningControls
                hasPrev={index > 0}
                onPrev={prev}
                onSkip={() => next()}
                onMarkWrong={() => next("skip")}
                onBlurry={() => next("blurry")}
                onKnow={() => next("vivid")}
              />
              <FlashCard
                key={current.id}
                problem={current}
                isFlipped={isFlipped}
                onClick={flip}
                timeLeft={timerSeconds > 0 ? timeLeft : null}
                timerTotal={timerSeconds}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

const PROBLEM_LIMIT_OPTIONS: (number | null)[] = [10, 20, 50, 100, null]
const TIMER_OPTIONS = [0, 10, 20, 30, 60]

export default function LearnPage() {
  const { t } = useTranslation()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [problemLimit, setProblemLimit] = useState<number | null>(null)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)
  const [mode, setMode] = useState<LearnMode>("flashcard")

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

  const sessionKey = [
    "remindly",
    "learn-session",
    selectedCategoryId || "all",
    mode,
    problemLimit ?? "all",
    timerSeconds,
  ].join(":")

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

      <div className="mb-6 flex flex-col gap-3">
        <div
          className="grid grid-cols-2 overflow-hidden rounded-lg border border-gray-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900"
          role="radiogroup"
          aria-label={t("learn.mode")}
        >
          {(["flashcard", "choice"] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              role="radio"
              aria-checked={mode === nextMode}
              onClick={() => setMode(nextMode)}
              className={cn(
                "min-h-10 rounded-md px-3 text-sm font-medium transition-colors",
                mode === nextMode
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800"
              )}
            >
              {nextMode === "flashcard" ? t("learn.modeFlashcard") : t("learn.modeChoice")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="shrink-0">{t("learn.problemCount")}</span>
            <select
              value={problemLimit ?? "all"}
              onChange={(e) => setProblemLimit(e.target.value === "all" ? null : Number(e.target.value))}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
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
              className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            >
              {TIMER_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? t("learn.timerOff") : `${v}${t("learn.secondsSuffix")}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <FlashcardSkeleton />
      ) : (
        <LearnSession
          key={sessionKey}
          problems={problems ?? []}
          problemLimit={problemLimit}
          timerSeconds={timerSeconds}
          storageKey={sessionKey}
          mode={mode}
        />
      )}
    </div>
  )
}
