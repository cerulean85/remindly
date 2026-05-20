"use client"

import { LEARNING_STAGE_KEYS, type Problem } from "@/types"
import { isStageChecked } from "@/lib/learningStages"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type Size = "sm" | "md"

interface LearningProgressBarProps {
  problem: Pick<Problem, "definition" | "components" | "diagram" | "comparison" | "linkage" | "progressCount">
  size?: Size
  showCount?: boolean
  className?: string
}

export function LearningProgressBar({
  problem,
  size = "sm",
  showCount = true,
  className,
}: LearningProgressBarProps) {
  const { t } = useTranslation()
  const filled = LEARNING_STAGE_KEYS.map((key) => isStageChecked(problem[key]))
  const total = LEARNING_STAGE_KEYS.length
  const count = problem.progressCount ?? filled.filter(Boolean).length

  const segmentClass = size === "md" ? "h-1.5" : "h-1"
  const textClass = size === "md" ? "text-[11px]" : "text-[10px]"

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex flex-1 gap-0.5" aria-label={t("problems.stage.progressLabel", { count, total })}>
        {LEARNING_STAGE_KEYS.map((key, i) => (
          <span
            key={key}
            title={t(`problems.stage.${key}`)}
            className={cn(
              "flex-1 rounded-full transition-colors",
              segmentClass,
              filled[i]
                ? "bg-emerald-500 dark:bg-emerald-400"
                : "bg-gray-200 dark:bg-neutral-700",
            )}
          />
        ))}
      </div>
      {showCount && (
        <span className={cn("shrink-0 tabular-nums text-gray-500 dark:text-gray-400", textClass)}>
          {count}/{total}
        </span>
      )}
    </div>
  )
}
