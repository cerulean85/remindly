import { LEARNING_STAGE_KEYS, type LearningStageKey } from "@/types"

type StagePartial = Partial<Record<LearningStageKey, boolean | null | undefined>>

export function isStageChecked(value: boolean | null | undefined): boolean {
  return value === true
}

export function progressCount(stages: StagePartial): number {
  return LEARNING_STAGE_KEYS.reduce(
    (acc, key) => acc + (isStageChecked(stages[key]) ? 1 : 0),
    0,
  )
}

export function sanitizeStageInput(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  return undefined
}
