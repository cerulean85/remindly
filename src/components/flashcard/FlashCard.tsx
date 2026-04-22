"use client"

import { cn } from "@/lib/utils"
import type { Problem } from "@/types"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { Badge } from "@/components/ui/Badge"

interface FlashCardProps {
  problem: Problem
  isFlipped: boolean
  onClick: () => void
}

export function FlashCard({ problem, isFlipped, onClick }: FlashCardProps) {
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
        <div className="[backface-visibility:hidden] [grid-area:1/1] flex flex-col justify-center min-h-[200px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <CategoryBadge category={problem.category} />
            <span className="text-xs text-gray-400">탭하여 정답 보기</span>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center flex-1 flex items-center justify-center whitespace-pre-wrap">
            {problem.question}
          </p>
        </div>

        {/* Back */}
        <div
          className="[backface-visibility:hidden] [grid-area:1/1] flex flex-col min-h-[200px] rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 shadow-sm p-6"
          style={{ transform: "rotateY(180deg)" }}
        >
          <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400 mb-3">정답</p>
          <p className="text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {problem.answer}
          </p>
          {problem.keywords.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {problem.keywords.map((kw) => (
                <Badge key={kw}>{kw}</Badge>
              ))}
            </div>
          )}
          {problem.memo && (
            <div className="mt-4 border-t border-indigo-200 dark:border-indigo-800 pt-3">
              <p className="text-xs font-medium text-indigo-400 dark:text-indigo-500 mb-1">메모</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{problem.memo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
