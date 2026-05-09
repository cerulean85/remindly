type RetrievalCounts = {
  skipCount: number
  blurryCount: number
  vividCount: number
}

export function totalAttempts(counts: RetrievalCounts | null | undefined): number {
  if (!counts) return 0
  return counts.skipCount + counts.blurryCount + counts.vividCount
}

export function retrievalRate(counts: RetrievalCounts | null | undefined): number | null {
  const total = totalAttempts(counts)
  if (total === 0) return null
  return Math.round((counts!.vividCount / total) * 100)
}

export function retrievalStats(counts: RetrievalCounts | null | undefined): {
  total: number
  rate: number | null
} {
  const total = totalAttempts(counts)
  const rate = total === 0 ? null : Math.round((counts!.vividCount / total) * 100)
  return { total, rate }
}
