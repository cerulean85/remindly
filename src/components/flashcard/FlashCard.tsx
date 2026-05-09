"use client"

import { useState, type MouseEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { Problem } from "@/types"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { Badge } from "@/components/ui/Badge"
import { ImageGallery } from "@/components/ui/ImageGallery"
import { MarkdownPreview } from "@/components/notes/MarkdownPreview"
import { MistakeRecordModal } from "@/components/flashcard/MistakeRecordModal"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface FlashCardProps {
  problem: Problem
  isFlipped: boolean
  onClick: () => void
  timeLeft?: number | null
  timerTotal?: number
}

export function FlashCard({ problem, isFlipped, onClick, timeLeft, timerTotal }: FlashCardProps) {
  const [recordModalMode, setRecordModalMode] = useState<"list" | "create" | null>(null)
  const [recordCountDelta, setRecordCountDelta] = useState(0)
  const showTimer = !isFlipped && typeof timeLeft === "number" && timerTotal && timerTotal > 0
  const isUrgent = showTimer && timeLeft! <= 5
  const wrongCount = problem.mistakeNote?.skipCount ?? 0
  const totalCount = problem.totalCount ?? 0
  const retrievalRate = problem.retrievalRate ?? null
  const recordCount = Math.max(0, (problem.mistakeRecordCount ?? 0) + recordCountDelta)

  const openRecordModal = (mode: "list" | "create", event: MouseEvent) => {
    event.stopPropagation()
    setRecordModalMode(mode)
  }

  return (
    <>
      <div
        className="[perspective:1000px] w-full cursor-pointer select-none"
        onClick={onClick}
      >
        {/* grid로 두 면이 같은 셀을 차지 → 높이 자동 결정 */}
        <div
          className="w-full grid h-[clamp(320px,62vh,560px)] [transform-style:preserve-3d] transition-transform duration-500"
          style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front */}
          <div className="[backface-visibility:hidden] [grid-area:1/1] flex min-h-0 flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <CategoryBadge category={problem.category} />
              {showTimer ? (
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  isUrgent ? "text-red-500" : "text-gray-500"
                )}>
                  ⏱ {timeLeft}s
                </span>
              ) : (
                <span className="text-xs text-gray-400">탭하여 설명 보기</span>
              )}
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center flex-1 flex items-center justify-center whitespace-pre-wrap">
              {problem.question}
            </p>
            <CardStats
              retrievalRate={retrievalRate}
              wrongCount={wrongCount}
              totalCount={totalCount}
              recordCount={recordCount}
              onOpenRecords={(event) => openRecordModal("list", event)}
              onCreateRecord={(event) => openRecordModal("create", event)}
            />
          </div>

          {/* Back */}
          <div
            className="[backface-visibility:hidden] [grid-area:1/1] flex min-h-0 flex-col rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 shadow-sm p-6"
            style={{ transform: "rotateY(180deg)" }}
          >
            <p className="mb-3 shrink-0 text-sm font-medium text-emerald-500 dark:text-emerald-400">설명</p>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <MarkdownPreview content={problem.answer} className="text-base" />
              {problem.images.length > 0 && (
                <div className="mt-4">
                  <ImageGallery images={problem.images} />
                </div>
              )}
              {problem.keywords.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {problem.keywords.map((kw) => (
                    <Badge key={kw}>{kw}</Badge>
                  ))}
                </div>
              )}
            </div>
            <CardStats
              retrievalRate={retrievalRate}
              wrongCount={wrongCount}
              totalCount={totalCount}
              recordCount={recordCount}
              onOpenRecords={(event) => openRecordModal("list", event)}
              onCreateRecord={(event) => openRecordModal("create", event)}
            />
          </div>
        </div>
      </div>

      {recordModalMode && (
        <MistakeRecordModal
          key={`${problem.id}-${recordModalMode}`}
          problem={problem}
          open={!!recordModalMode}
          initialMode={recordModalMode}
          onClose={() => setRecordModalMode(null)}
          onRecordCountChange={(delta) => setRecordCountDelta((count) => count + delta)}
        />
      )}
    </>
  )
}

function CardStats({
  retrievalRate,
  wrongCount,
  totalCount,
  recordCount,
  onOpenRecords,
  onCreateRecord,
}: {
  retrievalRate: number | null
  wrongCount: number
  totalCount: number
  recordCount: number
  onOpenRecords: (event: MouseEvent) => void
  onCreateRecord: (event: MouseEvent) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="mt-5 shrink-0 border-t border-gray-200 pt-4 dark:border-neutral-800">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t("learn.retrievalRate")} value={retrievalRate === null ? "-" : `${retrievalRate}%`} />
        <Stat label={t("learn.wrongCount")} value={wrongCount} />
        <Stat label={t("learn.studyCount")} value={totalCount} />
        <button
          type="button"
          onClick={onOpenRecords}
          className="rounded-lg border border-gray-200 px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-900/60"
        >
          <span className="block text-[11px] text-gray-500">{t("learn.mistakeRecordCount")}</span>
          <strong className="mt-0.5 block text-sm text-gray-900 dark:text-gray-100">{recordCount}</strong>
        </button>
      </div>
      <ButtonRow onCreateRecord={onCreateRecord} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 px-2 py-2 dark:border-neutral-800">
      <span className="block text-[11px] text-gray-500">{label}</span>
      <strong className="mt-0.5 block text-sm text-gray-900 dark:text-gray-100">{value}</strong>
    </div>
  )
}

function ButtonRow({ onCreateRecord }: { onCreateRecord: (event: MouseEvent) => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onCreateRecord}
      className="mt-3 h-9 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
    >
      {t("learn.addMistakeRecord")}
    </button>
  )
}
