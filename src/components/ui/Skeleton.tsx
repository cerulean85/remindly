import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-black/[0.06] dark:bg-white/[0.08]", className)}
      style={style}
    />
  )
}

export function ProblemCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-border-default shadow-sm p-4 pb-3">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-3" />
      <div className="flex gap-1.5 mb-3">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
        </div>
      </div>
    </div>
  )
}

export function ProblemRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-border-default shadow-sm px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full shrink-0" />
      <div className="shrink-0 flex gap-2 pl-2 border-l border-border-default">
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-3 w-6" />
      </div>
    </div>
  )
}

export function ProblemsPageSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" } = {}) {
  return (
    <div className="mx-auto max-w-lg sm:max-w-3xl lg:max-w-5xl xl:max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="ml-auto h-8 w-24 rounded-xl" />
      </div>
      <div className="mb-3 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-6 w-10 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProblemRowSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProblemCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MistakeCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-border-default shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full shrink-0" />
      </div>
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4 mb-3" />
      <div className="flex gap-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function MistakesPageSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Skeleton className="mb-6 h-7 w-24" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <MistakeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function FlashcardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-1.5 flex-1 rounded-full" />
      </div>
      <div className="rounded-2xl bg-surface-elevated border border-border-default shadow-sm p-6 min-h-[200px]">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col items-center gap-3 mt-12">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-11 rounded-xl" />
        <Skeleton className="flex-1 h-11 rounded-xl" />
        <Skeleton className="flex-1 h-11 rounded-xl" />
      </div>
    </div>
  )
}

export function LearnPageSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="ml-auto h-8 w-28 rounded-xl" />
      </div>
      <Skeleton className="mb-6 h-10 w-full rounded-xl" />
      <FlashcardSkeleton />
    </div>
  )
}

export function TrendChartSkeleton() {
  // Mirrors the SVG bar chart in dashboard/TrendChart: 7 vertical bars + axis row.
  return (
    <div className="h-40 w-full">
      <div className="flex h-[calc(100%-1rem)] items-end gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-none"
            style={{ height: `${30 + ((i * 13) % 60)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-2 flex-1" />
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-5">
      <Skeleton className="h-7 w-24" />
      {/* Overall rate card */}
      <div className="rounded-2xl bg-surface-elevated border border-border-default shadow-card p-5">
        <Skeleton className="mb-3 h-3 w-20" />
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
        <Skeleton className="mt-2 h-3 w-40" />
      </div>
      {/* Level cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-surface-elevated p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </div>
      {/* Trend chart card */}
      <div className="rounded-2xl bg-surface-elevated border border-border-default shadow-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-40 rounded-xl" />
        </div>
        <TrendChartSkeleton />
        <div className="mt-3 flex items-center gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-auto h-3 w-20" />
        </div>
      </div>
      {/* Priority list card */}
      <div className="rounded-2xl bg-surface-elevated border border-border-default shadow-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border-subtle px-3 py-2"
            >
              <Skeleton className="h-3 w-4" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RetrievalCalendarSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Skeleton className="mb-4 h-7 w-24" />
      <div className="rounded-2xl bg-surface-elevated border border-border-default p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-3 w-4" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export function NoteRowSkeleton() {
  return (
    <div className="rounded-xl px-3 py-2">
      <Skeleton className="mb-1.5 h-4 w-3/4" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function NoteListSkeleton({ count = 6 }: { count?: number } = {}) {
  return (
    <ul className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <NoteRowSkeleton />
        </li>
      ))}
    </ul>
  )
}

export function MindmapGraphSkeleton() {
  // Pulsing pseudo-nodes scattered across a relative container. Caller
  // provides the gradient background and surrounding sizing.
  const pulses: Array<{ top: string; left: string; size: number; delay: string }> = [
    { top: "30%", left: "22%", size: 22, delay: "0s" },
    { top: "45%", left: "48%", size: 30, delay: "0.15s" },
    { top: "60%", left: "70%", size: 18, delay: "0.3s" },
    { top: "25%", left: "70%", size: 14, delay: "0.05s" },
    { top: "70%", left: "30%", size: 16, delay: "0.4s" },
    { top: "55%", left: "20%", size: 10, delay: "0.2s" },
    { top: "35%", left: "80%", size: 10, delay: "0.25s" },
  ]
  return (
    <div className="absolute inset-0">
      {pulses.map((p, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-black/[0.08] dark:bg-white/[0.10]"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

export function ProblemEditorSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-5">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-14 rounded-full" />
      </div>
      <Skeleton className="h-9 w-40 rounded-xl" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function MistakeRecordSkeleton() {
  return (
    <div className="rounded-xl border border-border-default p-3">
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-3 h-4 w-2/3" />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-12 rounded-md" />
          <Skeleton className="h-7 w-12 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function MistakeRecordListSkeleton({ count = 3 }: { count?: number } = {}) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <MistakeRecordSkeleton />
        </li>
      ))}
    </ul>
  )
}
