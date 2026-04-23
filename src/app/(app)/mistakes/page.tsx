"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MistakeList } from "@/components/mistakes/MistakeList"
import { MistakesPageSkeleton } from "@/components/ui/Skeleton"
import type { MistakeNote } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export default function MistakesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: mistakes, isLoading } = useQuery<MistakeNote[]>({
    queryKey: ["mistakes"],
    queryFn: () => fetch("/api/mistakes").then((r) => r.json()),
    staleTime: 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (problemId: string) =>
      fetch(`/api/mistakes/${problemId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mistakes"] })
    },
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {isLoading ? (
        <MistakesPageSkeleton />
      ) : (
        <>
          <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-gray-100">{t("mistakes.title")}</h1>
          <MistakeList
            mistakes={mistakes ?? []}
            onDelete={(problemId) => deleteMutation.mutate(problemId)}
          />
        </>
      )}
    </div>
  )
}
