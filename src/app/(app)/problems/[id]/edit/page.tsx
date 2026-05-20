"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ProblemEditorPage } from "@/components/problems/ProblemEditorPage"
import type { Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditProblemPage({ params }: PageProps) {
  const { id } = use(params)
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: problem, isLoading, isError } = useQuery<Problem>({
    queryKey: ["problem", id],
    queryFn: () => fetch(`/api/problems/${id}`).then((r) => r.json()),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: {
      question: string
      answer: string
      keywords: string[]
      categoryId: string | null
      images: string[]
    }) => {
      const r = await fetch(`/api/problems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<Problem>
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["problem", id], updated)
      queryClient.invalidateQueries({ queryKey: ["problems"] })
      router.back()
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-gray-400">
        {t("common.loading")}
      </div>
    )
  }
  if (isError || !problem) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-gray-400">
        {t("common.error")}
      </div>
    )
  }

  return (
    <ProblemEditorPage
      mode="edit"
      title={t("problems.edit")}
      initial={problem}
      autosaveKey={`problemDraft:${id}`}
      onSubmit={async (data) => {
        await updateMutation.mutateAsync(data)
      }}
      isSubmitting={updateMutation.isPending}
    />
  )
}
