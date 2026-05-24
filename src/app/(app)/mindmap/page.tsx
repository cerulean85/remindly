"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { MindmapGraph } from "@/components/mindmap/MindmapGraph"
import { ProblemDetailSheet } from "@/components/problems/ProblemDetailSheet"
import type { MindmapData } from "@/lib/mindmap"
import type { Problem } from "@/types"
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

  const { data, isLoading, error } = useQuery<MindmapData>({
    queryKey: ["mindmap"],
    queryFn: () => fetch("/api/mindmap").then((r) => r.json()),
  })

  const { data: detailProblem } = useQuery<Problem>({
    queryKey: ["problem", selectedProblemId],
    queryFn: () => fetchProblem(selectedProblemId!),
    enabled: !!selectedProblemId,
  })

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

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 md:px-6">
        <h1 className="text-lg font-semibold text-text-primary">
          {t("nav.mindmap")}
        </h1>
        {data && (
          <p className="text-xs text-text-secondary">
            {t("mindmap.summary", {
              problems: data.nodes.filter((n) => n.type === "problem").length,
              keywords: data.nodes.filter((n) => n.type === "keyword").length,
            })}
          </p>
        )}
      </header>

      <div
        className="relative flex-1"
        style={{ background: resolvedTheme === "dark" ? BG_DARK : BG_LIGHT }}
      >
        {isLoading && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-text-tertiary">
            {t("common.loading")}
          </p>
        )}
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
