"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { MistakeRecord, Problem } from "@/types"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { Badge } from "@/components/ui/Badge"
import { TrophyIcon } from "@/components/ui/Icons"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type ViewMode = "grid" | "list"

interface Props {
  mistakes: MistakeRecord[]
  viewMode: ViewMode
  onDelete: (recordId: string) => void
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error ?? "Request failed")
  return data
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value))
}

export function MistakeList({ mistakes, viewMode, onDelete }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [detailTarget, setDetailTarget] = useState<Problem | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<MistakeRecord | null>(null)
  const [content, setContent] = useState("")

  const updateMutation = useMutation({
    mutationFn: (record: MistakeRecord) =>
      fetch(`/api/mistake-records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).then((r) => readJson<MistakeRecord>(r)),
    onSuccess: () => {
      setEditingRecord(null)
      setContent("")
      queryClient.invalidateQueries({ queryKey: ["mistakes"] })
    },
  })

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <TrophyIcon className="h-10 w-10 mb-2 text-amber-500" />
        <p className="font-medium">{t("mistakes.noMistakes")}</p>
        <p className="mt-1 max-w-sm text-sm">{t("mistakes.noMistakesMessage")}</p>
        <Link
          href="/learn"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          {t("mistakes.startLearning")}
        </Link>
      </div>
    )
  }

  const handleDeleteClick = (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation()
    setConfirmId(recordId)
  }

  const handleConfirmDelete = () => {
    if (confirmId) {
      onDelete(confirmId)
      setConfirmId(null)
    }
  }

  const startEdit = (e: React.MouseEvent, record: MistakeRecord) => {
    e.stopPropagation()
    setEditingRecord(record)
    setContent(record.content)
  }

  return (
    <>
      <ul
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            : "flex flex-col gap-2"
        )}
      >
        {mistakes.map((m) => (
          <li key={m.id} className={cn(viewMode === "grid" && "h-full")}>
            {viewMode === "grid" ? (
              <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <button
                  className="flex w-full flex-1 flex-col items-start p-4 pb-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
                  onClick={() => m.problem && setDetailTarget(m.problem)}
                >
                  <p className="mb-2 line-clamp-4 whitespace-pre-wrap text-sm font-semibold leading-5 text-gray-900 dark:text-gray-100">
                    {m.content}
                  </p>
                  <p className="line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{m.problem?.question}</p>
                  {m.problem && m.problem.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.problem.keywords.slice(0, 3).map((kw) => (
                        <Badge key={kw}>{kw}</Badge>
                      ))}
                      {m.problem.keywords.length > 3 && (
                        <Badge>+{m.problem.keywords.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </button>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 dark:border-neutral-800">
                  <div className="min-w-0">
                    <CategoryBadge category={m.problem?.category} />
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                    <span className="mr-1 text-[11px] text-gray-400">{formatDate(m.createdAt)}</span>
                    <button
                      type="button"
                      onClick={(e) => startEdit(e, m)}
                      className="rounded-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, m.id)}
                      className="rounded-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"
                    >
                      {t("mistakes.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-[minmax(9rem,1fr)_minmax(12rem,1.5fr)_7rem_8rem_auto] sm:items-center">
                <button
                  type="button"
                  onClick={() => m.problem && setDetailTarget(m.problem)}
                  className="min-w-0 text-left"
                >
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{m.problem?.question}</p>
                  <p className="mt-1 sm:hidden">
                    <CategoryBadge category={m.problem?.category} />
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => m.problem && setDetailTarget(m.problem)}
                  className="min-w-0 text-left"
                >
                  <p className="line-clamp-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{m.content}</p>
                </button>
                <div className="hidden sm:block">
                  <CategoryBadge category={m.problem?.category} />
                </div>
                <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                <div className="flex shrink-0 items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={(e) => startEdit(e, m)}
                    className="rounded-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, m.id)}
                    className="rounded-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"
                  >
                    {t("mistakes.delete")}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ProblemDetailSheet
        problem={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t("mistakes.editRecord")}
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setEditingRecord(null)}>
                {t("mistakes.cancel")}
              </Button>
              <Button
                disabled={!content.trim() || updateMutation.isPending}
                onClick={() => updateMutation.mutate(editingRecord)}
              >
                {updateMutation.isPending ? t("notes.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t("mistakes.deleteConfirm")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-800"
              >
                {t("mistakes.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
              >
                {t("mistakes.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
