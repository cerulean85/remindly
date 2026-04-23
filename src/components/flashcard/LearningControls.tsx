"use client"

import { Button } from "@/components/ui/Button"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface LearningControlsProps {
  isFlipped: boolean
  hasPrev: boolean
  onPrev: () => void
  onFlip: () => void
  onSkip: () => void
  onMarkWrong: () => void
  onHint: () => void
  onKnow: () => void
}

export function LearningControls({ isFlipped, hasPrev, onPrev, onFlip, onSkip, onMarkWrong, onHint, onKnow }: LearningControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3">
      {!isFlipped ? (
        <div className="flex gap-2">
          <Button variant="secondary" className="px-3" onClick={onPrev} disabled={!hasPrev}>
            ←
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onMarkWrong}>
            {t("learn.markWrong")}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onSkip}>
            {t("learn.skip")}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onHint}>
            {t("learn.hint")}
          </Button>
          <Button className="flex-1" onClick={onFlip}>
            {t("learn.flip")}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" className="px-3" onClick={onPrev}>
            ←
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onMarkWrong}>
            {t("learn.markWrong")}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onSkip}>
            {t("learn.skip")}
          </Button>
          <Button className="flex-1" onClick={onKnow}>
            {t("learn.know")}
          </Button>
        </div>
      )}
    </div>
  )
}
