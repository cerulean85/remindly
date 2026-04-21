"use client"

import { useQuery } from "@tanstack/react-query"
import { MistakeList } from "@/components/mistakes/MistakeList"
import { MistakesPageSkeleton } from "@/components/ui/Skeleton"
import type { MistakeNote } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export default function MistakesPage() {
  const { t } = useTranslation()

  const { data: mistakes, isLoading } = useQuery<MistakeNote[]>({
    queryKey: ["mistakes"],
    queryFn: () => fetch("/api/mistakes").then((r) => r.json()),
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {isLoading ? (
        <MistakesPageSkeleton />
      ) : (
        <>
          <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-gray-100">{t("mistakes.title")}</h1>
          <MistakeList mistakes={mistakes ?? []} />
        </>
      )}
    </div>
  )
}
