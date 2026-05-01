"use client"

import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface LearningControlsProps {
  isFlipped: boolean
  hasPrev: boolean
  onPrev: () => void
  onFlip: () => void
  onSkip: () => void
  onMarkWrong: () => void
  onBlurry: () => void
  onKnow: () => void
}

const ratingBaseClass =
  "flex-1 inline-flex items-center justify-center rounded-xl font-medium h-10 px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

const emptyClass =
  "border-2 border-red-300 dark:border-red-500/50 bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus-visible:ring-red-400"

const blurryClass =
  "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30 focus-visible:ring-amber-400"

const vividClass =
  "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500"

export function LearningControls({ isFlipped, hasPrev, onPrev, onFlip, onSkip, onMarkWrong, onBlurry, onKnow }: LearningControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button type="button" onClick={onMarkWrong} className={cn(ratingBaseClass, emptyClass)}>
          {t("learn.rateEmpty")}
        </button>
        <button type="button" onClick={onBlurry} className={cn(ratingBaseClass, blurryClass)}>
          {t("learn.rateBlurry")}
        </button>
        <button type="button" onClick={onKnow} className={cn(ratingBaseClass, vividClass)}>
          {t("learn.rateVivid")}
        </button>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" className="px-3" onClick={onPrev} disabled={!hasPrev}>
          ←
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onSkip}>
          {t("learn.skip")}
        </Button>
        {!isFlipped && (
          <Button className="flex-1" onClick={onFlip}>
            {t("learn.flip")}
          </Button>
        )}
      </div>
    </div>
  )
}
