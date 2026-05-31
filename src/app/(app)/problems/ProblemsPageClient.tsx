"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocalStorageState, enumSerializer } from "@/hooks/useLocalStorageState"
import Link from "next/link"
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { ConfirmModal } from "@/components/ui/Modal"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { LearningProgressBar } from "@/components/problems/LearningProgressBar"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { CategoryFilterBar } from "@/components/categories/CategoryFilterBar"
import { Badge } from "@/components/ui/Badge"
import {
  ProblemsPageSkeleton,
  ProblemCardSkeleton,
  ProblemRowSkeleton,
} from "@/components/ui/Skeleton"
import { ViewModeToggle } from "@/components/ui/ViewModeToggle"
import { ProblemsIcon, SearchIcon } from "@/components/ui/Icons"
import type { Category, Problem, UserSettings, ViewMode } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const PAGE_SIZE = 20

type SortField = "createdAt" | "vividCount" | "lastStudiedAt" | "retrievalRate"
type SortKey = `${SortField}:${"asc" | "desc"}`
const DEFAULT_SORT_KEY: SortKey = "createdAt:desc"

const SORT_OPTIONS: Array<{ key: SortKey; labelKey: string }> = [
  { key: "createdAt:desc", labelKey: "problems.sortNewest" },
  { key: "createdAt:asc", labelKey: "problems.sortOldest" },
  { key: "retrievalRate:desc", labelKey: "problems.sortRateDesc" },
  { key: "retrievalRate:asc", labelKey: "problems.sortRateAsc" },
  { key: "vividCount:desc", labelKey: "problems.sortVividDesc" },
  { key: "vividCount:asc", labelKey: "problems.sortVividAsc" },
  { key: "lastStudiedAt:desc", labelKey: "problems.sortRecent" },
  { key: "lastStudiedAt:asc", labelKey: "problems.sortStale" },
]

const VIEW_MODES: readonly ViewMode[] = ["grid", "list"]
const VIEW_STORAGE_KEY = "problems.viewMode"

const VALID_SORT_KEYS = new Set<SortKey>([
  "createdAt:desc",
  "createdAt:asc",
  "retrievalRate:desc",
  "retrievalRate:asc",
  "vividCount:desc",
  "vividCount:asc",
  "lastStudiedAt:desc",
  "lastStudiedAt:asc",
])

function parseSortKey(raw: string | null): SortKey {
  if (raw && (VALID_SORT_KEYS as Set<string>).has(raw)) return raw as SortKey
  return DEFAULT_SORT_KEY
}

function ProblemRow({
  problem,
  isGold,
  onDetail,
  onEdit,
  onDelete,
}: {
  problem: Problem
  isGold: boolean
  onDetail: (p: Problem) => void
  onEdit: (p: Problem) => void
  onDelete: (p: Problem) => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 shadow-sm transition-colors",
        isGold
          ? "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-500/15 dark:to-amber-700/10 border-amber-300 dark:border-amber-600/40"
          : "bg-surface-elevated border-border-default"
      )}
    >
      <button
        type="button"
        onClick={() => onDetail(problem)}
        className="flex-1 flex items-center gap-3 min-w-0 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-text-primary">{problem.question}</p>
            {problem.retrievalRate !== null && problem.retrievalRate !== undefined && (
              <span
                className={cn(
                  "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  isGold ? "bg-amber-500 text-white" : "bg-black/[0.06] dark:bg-white/[0.08] text-text-tertiary"
                )}
              >
                {problem.retrievalRate}%
              </span>
            )}
          </div>
          <p className="truncate text-xs text-text-secondary mt-0.5">{problem.answer}</p>
          <LearningProgressBar problem={problem} size="sm" className="mt-1.5 max-w-[12rem]" />
        </div>
        <div className="shrink-0">
          <CategoryBadge category={problem.category} />
        </div>
      </button>
      <div className="shrink-0 flex gap-2 pl-2 border-l border-border-default">
        <button
          className="text-xs text-text-secondary hover:text-emerald-500 transition-colors"
          onClick={() => onEdit(problem)}
        >
          수정
        </button>
        <button
          className="text-xs text-text-secondary hover:text-red-500 transition-colors"
          onClick={() => onDelete(problem)}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

function ProblemCard({
  problem,
  isGold,
  onDetail,
  onEdit,
  onDelete,
}: {
  problem: Problem
  isGold: boolean
  onDetail: (p: Problem) => void
  onEdit: (p: Problem) => void
  onDelete: (p: Problem) => void
}) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-44 flex-col overflow-hidden rounded-lg border shadow-sm",
        isGold
          ? "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/15 dark:to-amber-700/10 border-amber-300 dark:border-amber-600/40"
          : "bg-surface-elevated border-border-default"
      )}
    >
      <button
        className={cn(
          "flex-1 flex flex-col items-start w-full text-left p-4 pb-3 transition-colors",
          isGold
            ? "hover:bg-amber-100/70 dark:hover:bg-amber-500/10"
            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        )}
        onClick={() => onDetail(problem)}
      >
        <div className="flex items-start gap-2 w-full mb-1">
          <p className="flex-1 text-sm font-medium text-text-primary">{problem.question}</p>
          {problem.retrievalRate !== null && problem.retrievalRate !== undefined && (
            <span
              className={cn(
                "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                isGold
                  ? "bg-amber-500 text-white"
                  : "bg-black/[0.06] dark:bg-white/[0.08] text-text-tertiary"
              )}
            >
              {problem.retrievalRate}%
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary line-clamp-3">{problem.answer}</p>
        {problem.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {problem.keywords.slice(0, 3).map((kw) => (
              <Badge key={kw}>{kw}</Badge>
            ))}
            {problem.keywords.length > 3 && (
              <Badge>+{problem.keywords.length - 3}</Badge>
            )}
          </div>
        )}
        <LearningProgressBar problem={problem} size="sm" className="mt-2 w-full" />
      </button>

      <div className={cn(
        "mt-auto flex items-center justify-between px-4 py-1.5 border-t",
        isGold ? "border-amber-200/60 dark:border-amber-600/30" : "border-border-subtle"
      )}>
        <CategoryBadge category={problem.category} />
        <div className="flex gap-2">
          <button
            className="text-xs text-text-secondary hover:text-emerald-500 transition-colors"
            onClick={() => onEdit(problem)}
          >
            수정
          </button>
          <button
            className="text-xs text-text-secondary hover:text-red-500 transition-colors"
            onClick={() => onDelete(problem)}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

type ProblemsPage = { items: Problem[]; total: number; nextOffset: number | null }

export function ProblemsPageClient() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [detailTarget, setDetailTarget] = useState<Problem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Problem | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const goToEdit = (p: Problem) => router.push(`/problems/${p.id}/edit`)

  // Filters are hydrated from the URL on mount and mirrored back to the URL on
  // change, so navigating away (e.g. to the edit page) and back via
  // router.back() restores the same view. Hydration is deferred to a post-mount
  // effect (same pattern as viewMode below) to avoid any SSR/CSR mismatch from
  // reading useSearchParams() inside a useState initializer.
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT_KEY)
  const [filtersHydrated, setFiltersHydrated] = useState(false)
  const [viewMode, setViewMode] = useLocalStorageState<ViewMode>(
    VIEW_STORAGE_KEY,
    "grid",
    enumSerializer(VIEW_MODES),
  )

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      const q = (searchParams.get("q") ?? "").trim()
      setSelectedCategoryId(searchParams.get("category"))
      setSearchInput(q)
      setDebouncedSearch(q)
      setSortKey(parseSortKey(searchParams.get("sort")))
      setFiltersHydrated(true)
    })
    return () => {
      active = false
    }
    // Run once on mount; subsequent URL changes flow state → URL below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!filtersHydrated) return
    const params = new URLSearchParams()
    if (selectedCategoryId) params.set("category", selectedCategoryId)
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (sortKey !== DEFAULT_SORT_KEY) params.set("sort", sortKey)
    const next = params.toString()
    if (next === searchParams.toString()) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [filtersHydrated, selectedCategoryId, debouncedSearch, sortKey, pathname, router, searchParams])

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<ProblemsPage>({
    queryKey: ["problems", "paginated", { selectedCategoryId, debouncedSearch, sortKey }],
    queryFn: async ({ pageParam = 0 }) => {
      const [sort, order] = sortKey.split(":")
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(pageParam),
        sort,
        order,
      })
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId)
      if (debouncedSearch) params.set("search", debouncedSearch)
      const r = await fetch(`/api/problems?${params.toString()}`)
      return r.json()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  })

  const items = data?.pages.flatMap((p) => p.items) ?? []
  const totalCount = data?.pages[0]?.total ?? 0

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "300px" }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/problems/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); setDeleteTarget(null) },
  })

  if (isLoading) return <ProblemsPageSkeleton viewMode={viewMode} />

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDebouncedSearch(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setDebouncedSearch("")
  }

  const handleResetFilters = () => {
    setSelectedCategoryId(null)
    setSearchInput("")
    setDebouncedSearch("")
    setSortKey(DEFAULT_SORT_KEY)
  }

  // Export the current filtered view to a CSV that Excel opens directly, so
  // topics can be reviewed offline.
  const handleExport = async () => {
    if (isExporting) return
    if (totalCount === 0) {
      alert(t("problems.exportEmpty"))
      return
    }
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId)
      if (debouncedSearch) params.set("search", debouncedSearch)
      const qs = params.toString()
      const res = await fetch(`/api/problems/export${qs ? `?${qs}` : ""}`)
      if (!res.ok) throw new Error("export failed")
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "remindly_topics.csv"
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert(t("problems.exportFailed"))
    } finally {
      setIsExporting(false)
    }
  }

  const isSearching = debouncedSearch.length > 0
  const hasActiveFilters = selectedCategoryId !== null || isSearching || searchInput.trim().length > 0 || sortKey !== DEFAULT_SORT_KEY
  const isEmpty = items.length === 0

  return (
    <div className="mx-auto max-w-lg sm:max-w-3xl lg:max-w-5xl xl:max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-xl font-bold text-text-primary">{t("problems.title")}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || totalCount === 0}
          >
            {isExporting ? t("problems.exporting") : t("problems.export")}
          </Button>
          <Link href="/problems/new">
            <Button size="sm">
              + {t("problems.add")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <form className="min-w-[14rem] flex-1 relative" onSubmit={handleSearchSubmit}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("problems.searchPlaceholder")}
            className="w-full rounded-full border border-border-default bg-surface-elevated pl-9 pr-9 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              aria-label={t("common.close")}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="shrink-0 rounded-full border border-border-default bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{t(opt.labelKey)}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="shrink-0 rounded-full border border-border-default bg-surface-elevated px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            {t("problems.resetFilters")}
          </button>
        )}
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <CategoryFilterBar
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        showCounts
      />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-text-secondary">
          {isSearching ? (
            <SearchIcon className="h-10 w-10 mb-3 text-text-tertiary" />
          ) : (
            <ProblemsIcon className="h-10 w-10 mb-3 text-text-tertiary" />
          )}
          <p className="font-medium">
            {isSearching ? t("problems.noSearchResults") : t("problems.noProblems")}
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                : "flex flex-col gap-2"
            )}
          >
            {items.map((p) => {
              const threshold = settings?.retrievalThreshold ?? 80
              const isGold = p.retrievalRate !== null && p.retrievalRate !== undefined && p.retrievalRate >= threshold
              return viewMode === "grid" ? (
                <ProblemCard
                  key={p.id}
                  problem={p}
                  isGold={isGold}
                  onDetail={setDetailTarget}
                  onEdit={goToEdit}
                  onDelete={setDeleteTarget}
                />
              ) : (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  isGold={isGold}
                  onDetail={setDetailTarget}
                  onEdit={goToEdit}
                  onDelete={setDeleteTarget}
                />
              )
            })}
          </div>

          <div ref={sentinelRef} className="h-10" />

          {isFetchingNextPage && (
            viewMode === "list" ? (
              <div className="flex flex-col gap-2 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ProblemRowSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ProblemCardSkeleton key={i} />
                ))}
              </div>
            )
          )}

          {!hasNextPage && items.length > 0 && (
            <div className="py-4 text-center text-xs text-text-tertiary">
              {t("problems.allLoaded", { count: totalCount })}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t("problems.delete")}
        description={t("problems.deleteConfirm")}
      />

      <ProblemDetailSheet
        problem={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={goToEdit}
        onDelete={setDeleteTarget}
        onSwitchProblem={async (pid) => {
          const fresh = await queryClient.fetchQuery<Problem>({
            queryKey: ["problem", pid],
            queryFn: () => fetch(`/api/problems/${pid}`).then((r) => r.json()),
          })
          setDetailTarget(fresh)
        }}
      />
    </div>
  )
}
