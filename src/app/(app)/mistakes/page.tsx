"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MistakeList } from "@/components/mistakes/MistakeList"
import { MistakesPageSkeleton } from "@/components/ui/Skeleton"
import { ViewModeToggle } from "@/components/ui/ViewModeToggle"
import { CategoryFilterBar } from "@/components/categories/CategoryFilterBar"
import { SearchIcon } from "@/components/ui/Icons"
import type { Category, MistakeRecord, ViewMode } from "@/types"
import { useLocalStorageState, enumSerializer } from "@/hooks/useLocalStorageState"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const VIEW_MODES: readonly ViewMode[] = ["grid", "list"]
const VIEW_STORAGE_KEY = "mistakes.viewMode"

export default function MistakesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useLocalStorageState<ViewMode>(
    VIEW_STORAGE_KEY,
    "grid",
    enumSerializer(VIEW_MODES),
  )

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
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-text-primary">{t("mistakes.title")}</h1>
              <p className="mt-1 text-sm text-text-secondary">{t("mistakes.subtitle")}</p>
            </div>
            <Link
              href="/learn"
              className="ml-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              {t("mistakes.startLearning")}
            </Link>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("mistakes.searchPlaceholder")}
                className="h-11 w-full rounded-full border border-border-default bg-surface-elevated pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </div>

          <CategoryFilterBar
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />

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
