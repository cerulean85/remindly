"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MistakeList } from "@/components/mistakes/MistakeList"
import { MistakesPageSkeleton } from "@/components/ui/Skeleton"
import type { Category, MistakeRecord } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export default function MistakesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

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

          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("mistakes.searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
            />
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
            onDelete={(recordId) => deleteMutation.mutate(recordId)}
          />
        </>
      )}
    </div>
  )
}
