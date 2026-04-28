export interface Category {
  id: string
  name: string
  color: string
  userId: string
  createdAt: string
  _count?: { problems: number }
}

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
}

export interface MistakeNote {
  id: string
  problemId: string
  userId: string
  skipCount: number
  hintCount: number
  createdAt: string
  updatedAt: string
  problem?: Problem
}
