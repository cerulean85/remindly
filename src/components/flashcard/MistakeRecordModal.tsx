"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { ConfirmModal, Modal } from "@/components/ui/Modal"
import type { MistakeRecord, Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type Mode = "list" | "create"

interface MistakeRecordModalProps {
  problem: Problem
  open: boolean
  initialMode: Mode
  onClose: () => void
  onRecordCountChange?: (delta: number) => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error ?? "Request failed")
  return data
}

export function MistakeRecordModal({
  problem,
  open,
  initialMode,
  onClose,
  onRecordCountChange,
}: MistakeRecordModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [content, setContent] = useState("")
  const [editingRecord, setEditingRecord] = useState<MistakeRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MistakeRecord | null>(null)

  const recordsQuery = useQuery<MistakeRecord[]>({
    queryKey: ["mistakeRecords", problem.id],
    queryFn: () => fetch(`/api/problems/${problem.id}/mistake-records`).then((r) => readJson<MistakeRecord[]>(r)),
    enabled: open,
  })

  const invalidateRecords = () => {
    queryClient.invalidateQueries({ queryKey: ["mistakeRecords", problem.id] })
    queryClient.invalidateQueries({ queryKey: ["problems"] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/problems/${problem.id}/mistake-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).then((r) => readJson<MistakeRecord>(r)),
    onSuccess: () => {
      setContent("")
      setMode("list")
      onRecordCountChange?.(1)
      invalidateRecords()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (record: MistakeRecord) =>
      fetch(`/api/mistake-records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).then((r) => readJson<MistakeRecord>(r)),
    onSuccess: () => {
      setContent("")
      setEditingRecord(null)
      invalidateRecords()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (record: MistakeRecord) =>
      fetch(`/api/mistake-records/${record.id}`, { method: "DELETE" }).then((r) => readJson<{ success: boolean }>(r)),
    onSuccess: () => {
      setDeleteTarget(null)
      onRecordCountChange?.(-1)
      invalidateRecords()
    },
  })

  const startEdit = (record: MistakeRecord) => {
    setMode("list")
    setEditingRecord(record)
    setContent(record.content)
  }

  const cancelEdit = () => {
    setEditingRecord(null)
    setContent("")
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const canSubmit = content.trim().length > 0 && !isSaving
  const title = mode === "create" ? t("learn.addMistakeRecord") : t("learn.mistakeRecords")

  return (
    <>
      <Modal open={open} onClose={onClose} title={title} className="max-w-lg">
        {mode === "create" ? (
          <div className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("learn.recordPlaceholder")}
              className="min-h-32 w-full resize-y rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setMode("list")}>
                {t("common.cancel")}
              </Button>
              <Button disabled={!canSubmit} onClick={() => createMutation.mutate()}>
                {isSaving ? t("notes.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setMode("create")}>
                {t("learn.addMistakeRecord")}
              </Button>
            </div>

            {recordsQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-text-secondary">{t("common.loading")}</p>
            ) : recordsQuery.data?.length ? (
              <ul className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {recordsQuery.data.map((record) => (
                  <li
                    key={record.id}
                    className="rounded-xl border border-border-default p-3"
                  >
                    {editingRecord?.id === record.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="min-h-28 w-full resize-y rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={cancelEdit}>
                            {t("common.cancel")}
                          </Button>
                          <Button size="sm" disabled={!canSubmit} onClick={() => updateMutation.mutate(record)}>
                            {isSaving ? t("notes.saving") : t("common.save")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm text-text-primary">{record.content}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <time className="text-xs text-text-secondary">{formatDate(record.createdAt)}</time>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(record)}>
                              {t("common.edit")}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(record)}>
                              {t("common.delete")}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-text-secondary">{t("learn.noMistakeRecords")}</p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title={t("learn.deleteRecord")}
        description={t("learn.deleteRecordConfirm")}
        confirmLabel={t("common.delete")}
      />
    </>
  )
}
