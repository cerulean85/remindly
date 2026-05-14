"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MistakeList } from "@/components/mistakes/MistakeList"
import { MistakesPageSkeleton } from "@/components/ui/Skeleton"
import type { Category, MistakeRecord } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type ViewMode = "grid" | "list"
const VIEW_STORAGE_KEY = "mistakes.viewMode"

export default function MistakesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
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

  const { data: mistakes, isLoading } = useQuery<MistakeRecord[]>({
    queryKey: ["mistakes", selectedCategoryId, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId)
      if (search.trim()) params.set("search", search.trim())
      const query = params.toString()
      const url = query ? `/api/mistakes?${query}` : "/api/mistakes"
      return fetch(url).then((r) => r.json())
    },
    staleTime: 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) =>
      fetch(`/api/mistake-records/${recordId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mistakes"] })
    },
  })

  return (
    <div className="mx-auto max-w-lg sm:max-w-3xl lg:max-w-5xl xl:max-w-7xl px-4 py-6">
      {isLoading ? (
        <MistakesPageSkeleton />
      ) : (
        <>
          <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-gray-100">{t("mistakes.title")}</h1>

          <div className="mb-4 flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("mistakes.searchPlaceholder")}
              className="h-11 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <div className="shrink-0 flex rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
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
                </button>
              ))}
            </div>
          )}

          <MistakeList
            mistakes={mistakes ?? []}
            viewMode={viewMode}
            onDelete={(recordId) => deleteMutation.mutate(recordId)}
          />
        </>
      )}
    </div>
  )
}
