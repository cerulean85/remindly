"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import type { ProblemMindmap } from "@/lib/mindmap"
import { MindmapGraphSkeleton } from "@/components/ui/Skeleton"

// react-force-graph-2d touches window at module scope, so MindmapGraph must
// be loaded client-only to avoid breaking SSR/prerender.
const MindmapGraph = dynamic(
  () =>
    import("@/components/mindmap/MindmapGraph").then((m) => ({
      default: m.MindmapGraph,
    })),
  { ssr: false },
)

const BG_LIGHT =
  "radial-gradient(ellipse at center, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)"
const BG_DARK =
  "radial-gradient(ellipse at center, #1f2937 0%, #0b0f19 60%, #050810 100%)"

interface RelatedMindmapProps {
  problemId: string
  onSwitchProblem?: (problemId: string) => void
}

export function RelatedMindmap({ problemId, onSwitchProblem }: RelatedMindmapProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()

  const { data, isLoading, error } = useQuery<ProblemMindmap>({
    queryKey: ["problem-mindmap", problemId],
    queryFn: () =>
      fetch(`/api/problems/${problemId}/mindmap`).then((r) => r.json()),
    enabled: !!problemId,
  })

  const hasNeighbors =
    !!data &&
    data.nodes.filter((n) => n.type === "problem").length > 1

  return (
    <div>
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
        {t("mindmap.related")}
      </p>
      <div
        className="relative h-60 w-full overflow-hidden rounded-xl border border-border-default"
        style={{ background: resolvedTheme === "dark" ? BG_DARK : BG_LIGHT }}
      >
        {isLoading && <MindmapGraphSkeleton />}
        {error && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-red-500">
            {String(error)}
          </p>
        )}
        {data && !hasNeighbors && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-text-secondary">
            {t("mindmap.noRelated")}
          </p>
        )}
        {data && hasNeighbors && (
          <MindmapGraph
            data={data}
            focusedNodeId={data.focusedId}
            onProblemPick={(pid) => {
              if (pid !== problemId) onSwitchProblem?.(pid)
            }}
          />
        )}
      </div>
    </div>
  )
}
