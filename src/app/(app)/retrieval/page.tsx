"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { ConfirmModal, Modal } from "@/components/ui/Modal"
import { RetrievalCalendarSkeleton } from "@/components/ui/Skeleton"
import { useProblem } from "@/hooks/useProblem"
import { cn } from "@/lib/utils"
import type { Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type CalendarItem = {
  problemId: string
  question: string
  rating: "empty" | "blurry" | "vivid" | string
  studiedAt: string
  category: { id: string; name: string; color: string } | null
}

type CalendarDay = {
  date: string
  vividCount: number
  blurryCount: number
  emptyCount: number
  items: CalendarItem[]
}

type CalendarResponse = {
  year: number
  month: number
  days: CalendarDay[]
}

const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function getMonthGrid(year: number, month: number) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: Array<{ day: number | null; key: string | null }> = []
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, key: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: dateKey(year, month, d) })
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null })
  return cells
}

function ratingDot(rating: string) {
  if (rating === "vivid") return <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
  if (rating === "blurry") return <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
  return <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
}

export default function RetrievalPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Problem | null>(null)
  const goToEdit = (p: Problem) => router.push(`/problems/${p.id}/edit`)

  const { data: detailProblem } = useProblem(detailId)

  const { data, isLoading } = useQuery<CalendarResponse>({
    queryKey: ["retrieval-calendar", year, month],
    queryFn: () => fetch(`/api/retrieval/calendar?year=${year}&month=${month}`).then((r) => r.json()),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/problems/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error(await r.text())
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["retrieval-calendar"] })
      queryClient.invalidateQueries({ queryKey: ["problems"] })
      queryClient.removeQueries({ queryKey: ["problem", id] })
      setSelectedDay(null)
      setDetailId(null)
      setDeleteTarget(null)
    },
  })

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>()
    data?.days.forEach((d) => map.set(d.date, d))
    return map
  }, [data])

  const cells = useMemo(() => getMonthGrid(year, month), [year, month])

  const goPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else setMonth(month - 1)
  }
  const goNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else setMonth(month + 1)
  }

  if (isLoading && !data) {
    return <RetrievalCalendarSkeleton />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("retrieval.title")}</h1>

      <div className="rounded-2xl bg-surface-elevated border border-border-default p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-black/[0.04] dark:hover:bg-surface-elevated/[0.06]"
          >
            ←
          </button>
          <h2 className="text-base font-semibold text-text-primary">
            {year}.{String(month).padStart(2, "0")}
          </h2>
          <button
            onClick={goNext}
            className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-black/[0.04] dark:hover:bg-surface-elevated/[0.06]"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {KO_WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs font-medium text-text-tertiary py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell.day || !cell.key) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }
            const dayData = dayMap.get(cell.key)
            const isToday = cell.key === dateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

            return (
              <button
                key={cell.key}
                onClick={() => dayData && setSelectedDay(dayData)}
                disabled={!dayData}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 text-sm transition-all text-text-secondary",
                  dayData ? "hover:ring-2 hover:ring-emerald-300 cursor-pointer" : "cursor-default",
                  isToday && "ring-2 ring-emerald-500"
                )}
              >
                <span className="self-start text-xs font-medium">{cell.day}</span>
                {dayData && (
                  <div className="flex flex-col items-end gap-0.5 text-[10px] leading-tight font-mono">
                    {dayData.vividCount > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">V {dayData.vividCount}</span>
                    )}
                    {dayData.blurryCount > 0 && (
                      <span className="text-text-secondary">B {dayData.blurryCount}</span>
                    )}
                    {dayData.emptyCount > 0 && (
                      <span className="text-red-500 dark:text-red-400">E {dayData.emptyCount}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
          <span className="text-amber-600 dark:text-amber-400">V = Vivid</span>
          <span className="text-text-secondary">B = Blurry</span>
          <span className="text-red-500 dark:text-red-400">E = Empty</span>
        </div>

      </div>

      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay?.date ?? ""}
      >
        {selectedDay && (
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            <div className="flex gap-3 text-xs text-text-secondary mb-2">
              <span className="text-amber-600 dark:text-amber-400">Vivid {selectedDay.vividCount}</span>
              <span className="text-text-secondary">Blurry {selectedDay.blurryCount}</span>
              <span className="text-red-500">Empty {selectedDay.emptyCount}</span>
            </div>
            {selectedDay.items.length === 0 ? (
              <p className="text-sm text-text-secondary">{t("retrieval.noEntries")}</p>
            ) : (
              selectedDay.items.map((item, idx) => (
                <button
                  type="button"
                  key={`${item.problemId}-${idx}`}
                  onClick={() => setDetailId(item.problemId)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border-default px-3 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-surface-elevated/[0.04]"
                >
                  {ratingDot(item.rating)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-text-primary">{item.question}</p>
                    {item.category && (
                      <p className="text-xs" style={{ color: item.category.color }}>{item.category.name}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary shrink-0">
                    {new Date(item.studiedAt).toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </Modal>

      <ProblemDetailSheet
        problem={detailId && detailProblem?.id === detailId ? detailProblem : null}
        onClose={() => setDetailId(null)}
        onEdit={goToEdit}
        onDelete={setDeleteTarget}
        onSwitchProblem={setDetailId}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t("problems.delete")}
        description={t("problems.deleteConfirm")}
      />
    </div>
  )
}
