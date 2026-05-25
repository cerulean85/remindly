"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import type { MindmapMode } from "@/components/mindmap/MindmapGraph"

// react-force-graph-2d touches window at module scope, so MindmapGraph must
// be a client-only bundle.
const MindmapGraph = dynamic(
  () =>
    import("@/components/mindmap/MindmapGraph").then((m) => ({
      default: m.MindmapGraph,
    })),
  { ssr: false },
)
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import { MindmapGraphSkeleton } from "@/components/ui/Skeleton"
import { useProblem } from "@/hooks/useProblem"
import {
  applyKeywordConnection,
  applyKeywordDisconnect,
  type MindmapData,
  type MindmapNode,
} from "@/lib/mindmap"
import type { Problem } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const BG_LIGHT =
  "radial-gradient(ellipse at center, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)"
const BG_DARK =
  "radial-gradient(ellipse at center, #1f2937 0%, #0b0f19 60%, #050810 100%)"

const fetchProblem = (id: string): Promise<Problem> =>
  fetch(`/api/problems/${id}`).then((r) => r.json())

export default function MindmapPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { resolvedTheme } = useTheme()
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [mode, setMode] = useState<MindmapMode>("move")

  const { data, isLoading, error } = useQuery<MindmapData>({
    queryKey: ["mindmap"],
    queryFn: () => fetch("/api/mindmap").then((r) => r.json()),
  })

  const { data: detailProblem } = useProblem(selectedProblemId)

  // Build a placeholder Problem from the already-loaded graph node so the
  // sheet opens immediately on click. The real fetch enriches it shortly after.
  const stubProblem = useMemo<Problem | null>(() => {
    if (!selectedProblemId || !data) return null
    const node = data.nodes.find(
      (n) => n.type === "problem" && n.problemId === selectedProblemId,
    )
    if (!node || node.type !== "problem") return null
    return {
      id: node.problemId,
      question: node.label,
      answer: "",
      keywords: [],
      images: [],
      categoryId: node.categoryId,
      userId: "",
      createdAt: "",
      updatedAt: "",
    }
  }, [selectedProblemId, data])

  const displayProblem = detailProblem ?? stubProblem

  const handleProblemHover = (problemId: string | null) => {
    if (!problemId) return
    queryClient.prefetchQuery({
      queryKey: ["problem", problemId],
      queryFn: () => fetchProblem(problemId),
      staleTime: 60_000,
    })
  }

  // Optimistic mindmap edits: we never refetch ["mindmap"] on settle — the
  // optimistic patch is authoritative for what's on screen. Sibling caches
  // (problem detail, list, keywords) are invalidated so other surfaces catch
  // up in the background; their timing doesn't need to match the UI.
  const connectMutation = useMutation({
    mutationFn: async ({ problemId, keyword }: { problemId: string; keyword: string }) => {
      const r = await fetch(`/api/problems/${problemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addKeyword: keyword.trim() }),
      })
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<Problem>
    },
    onMutate: ({ problemId, keyword }) => {
      const previous = queryClient.getQueryData<MindmapData>(["mindmap"])
      if (previous) {
        queryClient.setQueryData<MindmapData>(
          ["mindmap"],
          applyKeywordConnection(previous, problemId, keyword),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["mindmap"], ctx.previous)
      }
    },
    onSettled: (_data, _err, { problemId }) => {
      queryClient.invalidateQueries({ queryKey: ["problem-mindmap"] })
      queryClient.invalidateQueries({ queryKey: ["problems"] })
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] })
      queryClient.invalidateQueries({ queryKey: ["keywords"] })
    },
  })

  // mirrorKeywords on the server applies the inverse change to the matched
  // problem automatically, so a single PATCH is enough for either direction.
  const disconnectMutation = useMutation({
    mutationFn: async ({ problemId, keyword }: { problemId: string; keyword: string }) => {
      const r = await fetch(`/api/problems/${problemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeKeyword: keyword.trim() }),
      })
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<Problem>
    },
    onMutate: ({ problemId, keyword }) => {
      const previous = queryClient.getQueryData<MindmapData>(["mindmap"])
      if (previous) {
        queryClient.setQueryData<MindmapData>(
          ["mindmap"],
          applyKeywordDisconnect(previous, problemId, keyword),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["mindmap"], ctx.previous)
      }
    },
    onSettled: (_data, _err, { problemId }) => {
      queryClient.invalidateQueries({ queryKey: ["problem-mindmap"] })
      queryClient.invalidateQueries({ queryKey: ["problems"] })
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] })
      queryClient.invalidateQueries({ queryKey: ["keywords"] })
    },
  })

  const handleConnect = (source: MindmapNode, target: MindmapNode) => {
    const sIsProblem = source.type === "problem"
    const tIsProblem = target.type === "problem"
    if (!sIsProblem && !tIsProblem) return // keyword ↔ keyword: nothing to add

    let problemId: string
    let keyword: string
    if (sIsProblem && tIsProblem) {
      problemId = source.problemId
      keyword = target.label
    } else if (sIsProblem) {
      problemId = source.problemId
      keyword = (target as Extract<MindmapNode, { type: "keyword" }>).keyword
    } else {
      problemId = (target as Extract<MindmapNode, { type: "problem" }>).problemId
      keyword = (source as Extract<MindmapNode, { type: "keyword" }>).keyword
    }
    if (!keyword.trim()) return
    connectMutation.mutate({ problemId, keyword })
  }

  const handleDisconnect = (source: MindmapNode, target: MindmapNode) => {
    const sIsProblem = source.type === "problem"
    const tIsProblem = target.type === "problem"
    if (!sIsProblem && !tIsProblem) return // keyword ↔ keyword: shouldn't exist

    // mirrorKeywords on the server propagates the change to the other side,
    // so a single PATCH suffices even for problem ↔ problem links.
    let problemId: string
    let keyword: string
    if (sIsProblem && tIsProblem) {
      problemId = source.problemId
      keyword = target.label
    } else if (sIsProblem) {
      problemId = source.problemId
      keyword = (target as Extract<MindmapNode, { type: "keyword" }>).keyword
    } else {
      problemId = (target as Extract<MindmapNode, { type: "problem" }>).problemId
      keyword = (source as Extract<MindmapNode, { type: "keyword" }>).keyword
    }
    disconnectMutation.mutate({ problemId, keyword })
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 md:px-6">
        <h1 className="text-lg font-semibold text-text-primary">
          {t("nav.mindmap")}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-border-default bg-surface-elevated overflow-hidden text-xs">
            {(["move", "connect", "disconnect"] as const).map((m) => {
              const activeColor =
                m === "disconnect" ? "bg-rose-500" : "bg-emerald-500"
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-3 py-1 transition-colors",
                    mode === m
                      ? `${activeColor} text-white`
                      : "text-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                  )}
                >
                  {t(`mindmap.mode.${m}`)}
                </button>
              )
            })}
          </div>
          {data && (
            <p className="text-xs text-text-secondary">
              {t("mindmap.summary", {
                problems: data.nodes.filter((n) => n.type === "problem").length,
                keywords: data.nodes.filter((n) => n.type === "keyword").length,
              })}
            </p>
          )}
        </div>
      </header>

      <div
        className="relative flex-1"
        style={{ background: resolvedTheme === "dark" ? BG_DARK : BG_LIGHT }}
      >
        {isLoading && <MindmapGraphSkeleton />}
        {error && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-red-500">
            {String(error)}
          </p>
        )}
        {data && data.nodes.length === 0 && !isLoading && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-text-secondary">
            {t("mindmap.empty")}
          </p>
        )}
        {data && data.nodes.length > 0 && (
          <MindmapGraph
            data={data}
            onProblemPick={setSelectedProblemId}
            onProblemHover={handleProblemHover}
            mode={mode}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        )}
      </div>

      <ProblemDetailSheet
        problem={displayProblem}
        onClose={() => setSelectedProblemId(null)}
        onEdit={(p) => router.push(`/problems/${p.id}/edit`)}
        onSwitchProblem={setSelectedProblemId}
      />
    </div>
  )
}
