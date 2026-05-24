"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { ProblemForm } from "@/components/problems/ProblemForm"
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import type { Category, Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface ProblemEditorPageProps {
  mode: "create" | "edit"
  title: string
  initial?: Partial<Problem>
  autosaveKey: string
  onSubmit: (data: {
    question: string
    answer: string
    keywords: string[]
    categoryId: string | null
    images: string[]
  }) => Promise<void>
  isSubmitting?: boolean
}

const FORM_ID = "problem-editor-form"

export function ProblemEditorPage({
  mode,
  title,
  initial,
  autosaveKey,
  onSubmit,
  isSubmitting,
}: ProblemEditorPageProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false, isUploading: false })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  useUnsavedChangesGuard(formState.isDirty)

  const handleBack = () => {
    if (formState.isDirty) {
      const ok = window.confirm(t("problems.leaveConfirm"))
      if (!ok) return
    }
    router.back()
  }

  // Make Esc trigger guarded back so users can dismiss intuitively.
  useEscapeKey(handleBack)

  const canSubmit = formState.isValid && !formState.isUploading && !isSubmitting

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t("problems.back")}
          className="h-9 w-9 shrink-0 rounded-full text-text-secondary hover:bg-black/[0.04] dark:hover:bg-surface-elevated/[0.06] transition-colors flex items-center justify-center"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-lg font-semibold text-text-primary truncate">
          {title}
        </h1>
        <Button
          size="sm"
          type="submit"
          form={FORM_ID}
          disabled={!canSubmit}
        >
          {t("common.save")}
        </Button>
      </div>

      <ProblemForm
        formId={FORM_ID}
        hideActions
        initial={initial}
        categories={categories}
        autosaveKey={autosaveKey}
        restoreDraft={mode === "create"}
        onSubmit={onSubmit}
        onCancel={handleBack}
        isLoading={isSubmitting}
        onStateChange={setFormState}
      />

      <p className="mt-3 text-xs text-text-tertiary" aria-live="polite">
        {formState.isDirty
          ? t("problems.savingDraft")
          : mode === "edit"
            ? ""
            : t("problems.draftSaved")}
      </p>
    </div>
  )
}
