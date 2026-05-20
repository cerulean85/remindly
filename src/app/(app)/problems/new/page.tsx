"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ProblemEditorPage } from "@/components/problems/ProblemEditorPage"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const AUTOSAVE_KEY = "problemDraft:new"

export default function NewProblemPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: {
      question: string
      answer: string
      keywords: string[]
      categoryId: string | null
      images: string[]
    }) => {
      const r = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] })
      router.replace("/problems")
    },
  })

  return (
    <ProblemEditorPage
      mode="create"
      title={t("problems.add")}
      autosaveKey={AUTOSAVE_KEY}
      onSubmit={(data) => createMutation.mutateAsync(data)}
      isSubmitting={createMutation.isPending}
    />
  )
}
