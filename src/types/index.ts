export interface Category {
  id: string
  name: string
  color: string
  userId: string
  createdAt: string
  _count?: { problems: number }
}

export const LEARNING_STAGE_KEYS = [
  "definition",
  "components",
  "diagram",
  "comparison",
  "linkage",
] as const

export type LearningStageKey = (typeof LEARNING_STAGE_KEYS)[number]

export interface Problem {
  id: string
  question: string
  answer: string
  keywords: string[]
  images: string[]
  categoryId: string | null
  userId: string
  createdAt: string
  updatedAt: string
  category?: Category | null
  mistakeNote?: MistakeNote | null
  mistakeRecordCount?: number
  retrievalRate?: number | null
  totalCount?: number
  lastStudiedAt?: string | null
  definition?: boolean
  components?: boolean
  diagram?: boolean
  comparison?: boolean
  linkage?: boolean
  progressCount?: number
}

export interface MistakeNote {
  id: string
  problemId: string
  userId: string
  skipCount: number
  blurryCount: number
  vividCount: number
  lastStudiedAt: string | null
  createdAt: string
  updatedAt: string
  problem?: Problem
}

export interface UserSettings {
  retrievalThreshold: number
  staleDays: number
}

export interface CalendarDay {
  date: string
  vividCount: number
  blurryCount: number
  emptyCount: number
}

export interface StudyLogEntry {
  id: string
  problemId: string
  rating: "empty" | "blurry" | "vivid"
  studiedAt: string
  problem?: Problem
}

export interface MistakeRecord {
  id: string
  problemId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
  problem?: Problem
}
