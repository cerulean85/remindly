"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Modal } from "@/components/ui/Modal"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { cn } from "@/lib/utils"
import type { Problem } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type Level = "vivid" | "blurry" | "empty"

type ProblemSummary = {
  id: string
  question: string
  category: { id: string; name: string; color: string } | null
  retrievalRate: number | null
  totalCount: number
  lastStudiedAt: string | null
}

type DashboardData = {
  settings: { retrievalThreshold: number; staleDays: number }
  summary: {
    totalProblems: number
    vividCount: number
    blurryCount: number
    emptyCount: number
    overallRate: number
  }
  byLevel: Record<Level, ProblemSummary[]>
  priority: ProblemSummary[]
}

type Period = "daily" | "weekly" | "monthly"

type TrendBucket = { label: string; vividCount: number; blurryCount: number; emptyCount: number }

const LEVEL_STYLE: Record<Level, { bg: string; text: string; dot: string }> = {
  vivid: {
    bg: "bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border-amber-200 dark:border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  blurry: {
    bg: "bg-gray-50 dark:bg-gray-500/10 hover:bg-gray-100 dark:hover:bg-gray-500/20 border-gray-200 dark:border-gray-500/30",
    text: "text-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  empty: {
    bg: "bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-red-200 dark:border-red-500/30",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-400",
  },
}

function formatBucketLabel(label: string, period: Period) {
  if (period === "daily") {
    const [, m, d] = label.split("-")
    return `${m}/${d}`
  }
  if (period === "monthly") {
    const [y, m] = label.split("-")
    return `${y.slice(2)}/${m}`
  }
  const [, m, d] = label.split("-")
  return `${m}/${d}`
}

function TrendChart({ buckets }: { buckets: TrendBucket[] }) {
  const width = 100
  const barWidth = width / Math.max(buckets.length, 1)
  return (
    <svg viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" className="h-40 w-full">
      {buckets.map((b, i) => {
        const total = b.vividCount + b.blurryCount + b.emptyCount
        if (total === 0) {
          return (
            <rect
              key={b.label}
              x={i * barWidth + barWidth * 0.15}
              y={95}
              width={barWidth * 0.7}
              height={2}
              className="fill-gray-200 dark:fill-neutral-700"
            />
          )
        }
        const vivid = (b.vividCount / total) * 100
        const blurry = (b.blurryCount / total) * 100
        const empty = (b.emptyCount / total) * 100
        const x = i * barWidth + barWidth * 0.15
        const w = barWidth * 0.7
        return (
          <g key={b.label}>
            <rect x={x} y={0} width={w} height={vivid} className="fill-amber-400" />
            <rect x={x} y={vivid} width={w} height={blurry} className="fill-gray-400" />
            <rect x={x} y={vivid + blurry} width={w} height={empty} className="fill-red-400" />
          </g>
        )
      })}
    </svg>
  )
}

function TrendXAxis({ buckets, period }: { buckets: TrendBucket[]; period: Period }) {
  const stride = period === "daily" ? 2 : 1
  return (
    <div className="mt-1 flex justify-between text-[10px] text-gray-400">
      {buckets.map((b, i) => (
        <span key={b.label} className={cn("flex-1 text-center", i % stride !== 0 && "invisible")}>
          {formatBucketLabel(b.label, period)}
        </span>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [modalLevel, setModalLevel] = useState<Level | null>(null)
  const [period, setPeriod] = useState<Period>("daily")
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: detailProblem } = useQuery<Problem>({
    queryKey: ["problem", detailId],
    queryFn: () => fetch(`/api/problems/${detailId}`).then((r) => r.json()),
    enabled: !!detailId,
  })

  const { data: dash, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  })

  const { data: trend, isLoading: trendLoading } = useQuery<{ period: Period; buckets: TrendBucket[] }>({
    queryKey: ["dashboard-trends", period],
    queryFn: () => fetch(`/api/dashboard/trends?period=${period}`).then((r) => r.json()),
  })

  if (dashLoading || !dash) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="text-sm text-gray-400">{t("common.loading")}</div>
      </div>
    )
  }

  const { summary, byLevel, priority, settings } = dash

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("dashboard.title")}</h1>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
          {t("dashboard.overallRate")}
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-amber-500">{summary.overallRate}%</span>
          <span className="text-sm text-gray-500">
            {summary.vividCount} / {summary.totalProblems} {t("dashboard.subjects")}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-300 to-amber-500"
            style={{ width: `${summary.overallRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {t("dashboard.threshold", { value: settings.retrievalThreshold })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["vivid", "blurry", "empty"] as Level[]).map((level) => {
          const count = summary[`${level}Count` as const]
          const styles = LEVEL_STYLE[level]
          return (
            <button
              key={level}
              onClick={() => setModalLevel(level)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-colors",
                styles.bg
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
                <span className={cn("text-xs font-medium uppercase tracking-wide", styles.text)}>
                  {t(`dashboard.${level}`)}
                </span>
              </div>
              <div className={cn("text-2xl font-bold", styles.text)}>{count}</div>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t("dashboard.trend")}
          </h2>
          <div className="flex rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden text-xs">
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 transition-colors",
                  period === p
                    ? "bg-emerald-500 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                )}
              >
                {t(`dashboard.${p}`)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/retrieval")}
          className="block w-full text-left rounded-xl p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition-colors"
        >
          {trendLoading || !trend ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">
              {t("common.loading")}
            </div>
          ) : (
            <>
              <TrendChart buckets={trend.buckets} />
              <TrendXAxis buckets={trend.buckets} period={period} />
            </>
          )}
        </button>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-amber-400" /> Vivid
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-gray-400" /> Blurry
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-red-400" /> Empty
          </span>
          <span className="ml-auto text-emerald-500">{t("dashboard.openCalendar")} →</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t("dashboard.todayPriority")}
          </h2>
          <Link href="/learn" className="text-emerald-500 text-xs hover:underline">
            {t("dashboard.startLearning")} →
          </Link>
        </div>
        {priority.length === 0 ? (
          <p className="text-sm text-gray-500 py-3">{t("dashboard.noPriority")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {priority.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setDetailId(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 dark:border-neutral-800 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  <span className="text-xs font-mono text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-gray-900 dark:text-gray-100">{p.question}</p>
                    {p.category && (
                      <p className="text-xs" style={{ color: p.category.color }}>{p.category.name}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {p.retrievalRate === null ? "—" : `${p.retrievalRate}%`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProblemDetailSheet
        problem={detailId && detailProblem?.id === detailId ? detailProblem : null}
        onClose={() => setDetailId(null)}
      />

      <Modal
        open={modalLevel !== null}
        onClose={() => setModalLevel(null)}
        title={modalLevel ? t(`dashboard.${modalLevel}List`) : ""}
      >
        {modalLevel && (
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {byLevel[modalLevel].length === 0 ? (
              <p className="text-sm text-gray-500">{t("dashboard.noSubjects")}</p>
            ) : (
              byLevel[modalLevel].map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-gray-900 dark:text-gray-100">{p.question}</p>
                    {p.category && (
                      <p className="text-xs" style={{ color: p.category.color }}>{p.category.name}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {p.retrievalRate === null ? "—" : `${p.retrievalRate}%`}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
