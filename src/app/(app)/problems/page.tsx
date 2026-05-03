"use client"

import { useEffect, useRef, useState } from "react"
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ConfirmModal } from "@/components/ui/Modal"
import { ProblemForm } from "@/components/problems/ProblemForm"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { Badge } from "@/components/ui/Badge"
import { ProblemsPageSkeleton } from "@/components/ui/Skeleton"
import { ProblemsIcon, SearchIcon } from "@/components/ui/Icons"
import type { Category, Problem, UserSettings } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const PAGE_SIZE = 20

type SortField = "createdAt" | "vividCount" | "lastStudiedAt" | "retrievalRate"
type SortKey = `${SortField}:${"asc" | "desc"}`

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

type ViewMode = "grid" | "list"
const VIEW_STORAGE_KEY = "problems.viewMode"

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
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-sm transition-colors",
        isGold
          ? "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-500/15 dark:to-amber-700/10 border-amber-300 dark:border-amber-600/40"
          : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
      )}
    >
      <button
        type="button"
        onClick={() => onDetail(problem)}
        className="flex-1 flex items-center gap-3 min-w-0 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{problem.question}</p>
            {problem.retrievalRate !== null && problem.retrievalRate !== undefined && (
              <span
                className={cn(
                  "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  isGold ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"
                )}
              >
                {problem.retrievalRate}%
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-500 mt-0.5">{problem.answer}</p>
        </div>
        <div className="shrink-0">
          <CategoryBadge category={problem.category} />
        </div>
      </button>
      <div className="shrink-0 flex gap-2 pl-2 border-l border-gray-200 dark:border-neutral-800">
        <button
          className="text-xs text-gray-500 hover:text-emerald-500 transition-colors"
          onClick={() => onEdit(problem)}
        >
          수정
        </button>
        <button
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
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
        "relative overflow-hidden rounded-2xl shadow-sm flex flex-col h-full border",
        isGold
          ? "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/15 dark:to-amber-700/10 border-amber-300 dark:border-amber-600/40"
          : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
      )}
    >
      <button
        className={cn(
          "flex-1 flex flex-col items-start w-full text-left p-4 pb-3 transition-colors",
          isGold
            ? "hover:bg-amber-100/70 dark:hover:bg-amber-500/10"
            : "hover:bg-gray-50 dark:hover:bg-neutral-800/60"
        )}
        onClick={() => onDetail(problem)}
      >
        <div className="flex items-start gap-2 w-full mb-1">
          <p className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{problem.question}</p>
          {problem.retrievalRate !== null && problem.retrievalRate !== undefined && (
            <span
              className={cn(
                "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                isGold
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"
              )}
            >
              {problem.retrievalRate}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{problem.answer}</p>
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
      </button>

      <div className={cn(
        "mt-auto flex items-center justify-between px-4 py-3 border-t",
        isGold ? "border-amber-200/60 dark:border-amber-600/30" : "border-gray-100 dark:border-neutral-800"
      )}>
        <CategoryBadge category={problem.category} />
        <div className="flex gap-2">
          <button
            className="text-xs text-gray-500 hover:text-emerald-500 transition-colors"
            onClick={() => onEdit(problem)}
          >
            수정
          </button>
          <button
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
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

export default function ProblemsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [detailTarget, setDetailTarget] = useState<Problem | null>(null)
  const [editTarget, setEditTarget] = useState<Problem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Problem | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt:desc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored !== "grid" && stored !== "list") return

    let active = true
    queueMicrotask(() => {
      if (active) setViewMode(stored)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode)
  }, [viewMode])

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

  const createMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; keywords: string[]; categoryId: string | null; images: string[] }) => {
      const r = await fetch("/api/problems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); setShowAdd(false) },
  })

  const editMutation = useMutation({
    mutationFn: async (data: { id: string; question: string; answer: string; keywords: string[]; categoryId: string | null }) => {
      const r = await fetch(`/api/problems/${data.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); setEditTarget(null) },
  })

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

  const isSearching = debouncedSearch.length > 0
  const isEmpty = items.length === 0

  return (
    <div className="mx-auto max-w-lg sm:max-w-3xl lg:max-w-5xl xl:max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("problems.title")}</h1>
        <Button size="sm" className="ml-auto" onClick={() => setShowAdd(true)}>
          + {t("problems.add")}
        </Button>
      </div>

      <div className="mb-3 flex gap-2">
        <form className="flex-1 relative" onSubmit={handleSearchSubmit}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
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
            className="w-full rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-9 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
          className="rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{t(opt.labelKey)}</option>
          ))}
        </select>
        <div className="flex rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label={t("problems.viewGrid")}
            title={t("problems.viewGrid")}
            className={cn(
              "px-3 py-2 text-sm transition-colors",
              viewMode === "grid"
                ? "bg-emerald-500 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label={t("problems.viewList")}
            title={t("problems.viewList")}
            className={cn(
              "px-3 py-2 text-sm transition-colors",
              viewMode === "list"
                ? "bg-emerald-500 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              selectedCategoryId === null
                ? "bg-emerald-500 text-white border-emerald-500"
                : "border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
            )}
          >
            {t("problems.allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                selectedCategoryId === cat.id
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
              )}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedCategoryId === cat.id ? "white" : cat.color }}
              />
              {cat.name}
              {cat._count !== undefined && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  selectedCategoryId === cat.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
                )}>
                  {cat._count.problems}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
          {isSearching ? (
            <SearchIcon className="h-10 w-10 mb-3 text-gray-400" />
          ) : (
            <ProblemsIcon className="h-10 w-10 mb-3 text-gray-400" />
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
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ) : (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  isGold={isGold}
                  onDetail={setDetailTarget}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              )
            })}
          </div>

          <div ref={sentinelRef} className="h-10" />

          {isFetchingNextPage && (
            <div className="py-4 text-center text-sm text-gray-400">{t("common.loading")}</div>
          )}

          {!hasNextPage && items.length > 0 && (
            <div className="py-4 text-center text-xs text-gray-400">
              {t("problems.allLoaded", { count: totalCount })}
            </div>
          )}
        </>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("problems.add")}>
        <ProblemForm
          categories={categories}
          onSubmit={(data) => createMutation.mutateAsync(data)}
          onCancel={() => setShowAdd(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={t("problems.edit")}>
        {editTarget && (
          <ProblemForm
            initial={editTarget}
            categories={categories}
            onSubmit={(data) => editMutation.mutateAsync({ id: editTarget.id, ...data })}
            onCancel={() => setEditTarget(null)}
            isLoading={editMutation.isPending}
          />
        )}
      </Modal>

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
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />
    </div>
  )
}
