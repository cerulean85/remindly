"use client"

import { cn } from "@/lib/utils"
import type { Problem } from "@/types"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { Badge } from "@/components/ui/Badge"
import { ImageGallery } from "@/components/ui/ImageGallery"

interface FlashCardProps {
  problem: Problem
  isFlipped: boolean
  onClick: () => void
  timeLeft?: number | null
  timerTotal?: number
}

export function FlashCard({ problem, isFlipped, onClick, timeLeft, timerTotal }: FlashCardProps) {
  const showTimer = !isFlipped && typeof timeLeft === "number" && timerTotal && timerTotal > 0
  const isUrgent = showTimer && timeLeft! <= 5
  return (
    <div
      className="[perspective:1000px] w-full cursor-pointer select-none"
      onClick={onClick}
    >
      {/* grid로 두 면이 같은 셀을 차지 → 높이 자동 결정 */}
      <div
        className="w-full grid [transform-style:preserve-3d] transition-transform duration-500"
        style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Front */}
        <div className="[backface-visibility:hidden] [grid-area:1/1] flex flex-col justify-center min-h-[200px] rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm p-6">
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
        </div>

        {/* Back */}
        <div
          className="[backface-visibility:hidden] [grid-area:1/1] flex flex-col min-h-[200px] rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 shadow-sm p-6"
          style={{ transform: "rotateY(180deg)" }}
        >
          <p className="text-sm font-medium text-emerald-500 dark:text-emerald-400 mb-3">설명</p>
          <p className="text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {problem.answer}
          </p>
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
      </div>
    </div>
  )
}
