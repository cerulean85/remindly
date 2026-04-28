"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ConfirmModal } from "@/components/ui/Modal"
import { ProblemForm } from "@/components/problems/ProblemForm"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { CategoryBadge } from "@/components/categories/CategoryBadge"
import { Badge } from "@/components/ui/Badge"
import { ProblemsPageSkeleton } from "@/components/ui/Skeleton"
import { useSwipe } from "@/hooks/useSwipe"
import type { Category, Problem } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

function ProblemCard({
  problem,
  onDetail,
  onEdit,
  onDelete,
}: {
  problem: Problem
  onDetail: (p: Problem) => void
  onEdit: (p: Problem) => void
  onDelete: (p: Problem) => void
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col h-full">
      <button
        className="flex-1 flex flex-col items-start w-full text-left p-4 pb-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        onClick={() => onDetail(problem)}
      >
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{problem.question}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{problem.answer}</p>
        {problem.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {problem.keywords.slice(0, 3).map((kw) => (
              <Badge key={kw}>{kw}</Badge>
            ))}
            {problem.keywords.length > 3 && (
              <Badge>+{problem.keywords.length - 3}</Badge>
            )}
          </div>
        )}
      </button>

      <div className="mt-auto flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <CategoryBadge category={problem.category} />
        <div className="flex gap-2">
          <button
            className="text-xs text-gray-500 hover:text-indigo-500 transition-colors"
            onClick={() => onEdit(problem)}
          >
            수정
          </button>
          <button
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            onClick={() => onDelete(problem)}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProblemsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [detailTarget, setDetailTarget] = useState<Problem | null>(null)
  const [editTarget, setEditTarget] = useState<Problem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Problem | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const { data: problems = [], isLoading } = useQuery<Problem[]>({
    queryKey: ["problems", selectedCategoryId],
    queryFn: () => {
      const url = selectedCategoryId
        ? `/api/problems?categoryId=${selectedCategoryId}`
        : "/api/problems"
      return fetch(url).then((r) => r.json())
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; keywords: string[]; categoryId: string | null; images: string[] }) => {
      const r = await fetch("/api/problems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); setShowAdd(false) },
  })

  const editMutation = useMutation({
    mutationFn: async (data: { id: string; question: string; answer: string; keywords: string[]; categoryId: string | null }) => {
      const r = await fetch(`/api/problems/${data.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); setEditTarget(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/problems/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); setDeleteTarget(null) },
  })

  if (isLoading) return <ProblemsPageSkeleton />

  return (
    <div className="mx-auto max-w-lg sm:max-w-3xl lg:max-w-5xl xl:max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("problems.title")}</h1>
        <Button size="sm" className="ml-auto" onClick={() => setShowAdd(true)}>
          + {t("problems.add")}
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              selectedCategoryId === null
                ? "bg-indigo-500 text-white border-indigo-500"
                : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedCategoryId === cat.id ? "white" : cat.color }}
              />
              {cat.name}
              {cat._count !== undefined && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  selectedCategoryId === cat.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                )}>
                  {cat._count.problems}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {problems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
          <p className="text-3xl mb-3">🗂</p>
          <p className="font-medium">{t("problems.noProblems")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {problems.map((p) => (
            <ProblemCard
              key={p.id}
              problem={p}
              onDetail={setDetailTarget}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("problems.add")}>
        <ProblemForm
          categories={categories}
          onSubmit={(data) => createMutation.mutateAsync(data)}
          onCancel={() => setShowAdd(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={t("problems.edit")}>
        {editTarget && (
          <ProblemForm
            initial={editTarget}
            categories={categories}
            onSubmit={(data) => editMutation.mutateAsync({ id: editTarget.id, ...data })}
            onCancel={() => setEditTarget(null)}
            isLoading={editMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t("problems.delete")}
        description={t("problems.deleteConfirm")}
      />

      <ProblemDetailSheet
        problem={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />
    </div>
  )
}
