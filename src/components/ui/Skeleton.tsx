import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)} />
  )
}

export function ProblemCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-4 pb-3">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-3" />
      <div className="flex gap-1.5 mb-3">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
        </div>
      </div>
    </div>
  )
}

export function ProblemsPageSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="ml-auto h-8 w-24 rounded-xl" />
      </div>
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-6 w-10 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProblemCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function MistakeCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-4">
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
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-6 min-h-[200px]">
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
