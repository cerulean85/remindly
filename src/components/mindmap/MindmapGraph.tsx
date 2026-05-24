"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import type { MindmapData, MindmapNode } from "@/lib/mindmap"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })

const PROBLEM_DEFAULT_COLOR = "#10b981"
const KEYWORD_COLOR_LIGHT = "#9ca3af"
const KEYWORD_COLOR_DARK = "#52525b"

export type MindmapMode = "move" | "connect"

interface MindmapGraphProps {
  data: MindmapData
  onProblemPick: (problemId: string) => void
  onProblemHover?: (problemId: string | null) => void
  focusedNodeId?: string | null
  mode?: MindmapMode
  /** Called when the user drags one node onto another in connect mode. */
  onConnect?: (source: MindmapNode, target: MindmapNode) => void
}

type PositionedNode = MindmapNode & { x?: number; y?: number }

function truncate(text: string, max = 20): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + "…"
}

function applyAlpha(color: string, alpha: number): string {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  return color
}

function keywordRadius(degree: number): number {
  return 2 + Math.sqrt(degree) * 1.6
}

const PROBLEM_RADIUS = 6.5

export function MindmapGraph({
  data,
  onProblemPick,
  onProblemHover,
  focusedNodeId = null,
  mode = "move",
  onConnect,
}: MindmapGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pendingSourceId, setPendingSourceId] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const isConnectMode = mode === "connect"

  // Reset any in-progress selection whenever the mode flips.
  useEffect(() => {
    setPendingSourceId(null)
  }, [isConnectMode])

  // ESC clears the pending source in connect mode.
  useEffect(() => {
    if (!isConnectMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingSourceId(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isConnectMode])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setSize({ width: rect.width, height: rect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const graphData = useMemo(
    () => ({ nodes: data.nodes, links: data.links }),
    [data],
  )

  // Adjacency: nodeId -> set of neighbor ids. Built once per data change.
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>()
    const idOf = (end: unknown): string | null => {
      if (typeof end === "string") return end
      if (end && typeof end === "object" && "id" in end) {
        const v = (end as { id?: unknown }).id
        return typeof v === "string" ? v : null
      }
      return null
    }
    for (const link of data.links) {
      const s = idOf(link.source)
      const t = idOf(link.target)
      if (!s || !t) continue
      if (!map.has(s)) map.set(s, new Set())
      if (!map.has(t)) map.set(t, new Set())
      map.get(s)!.add(t)
      map.get(t)!.add(s)
    }
    return map
  }, [data])

  const keywordColor = isDark ? KEYWORD_COLOR_DARK : KEYWORD_COLOR_LIGHT
  const problemLabelColor = isDark ? "#f3f4f6" : "#0f172a"
  const keywordLabelColor = isDark ? "#9ca3af" : "#4b5563"
  const ringColor = isDark ? "#ffffff" : "#0f172a"

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={isConnectMode ? { cursor: "pointer" } : undefined}
    >
      {size.width > 0 && size.height > 0 && (
        <ForceGraph2D
          width={size.width}
          height={size.height}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={5}
          cooldownTicks={120}
          nodeVal={(node) => {
            const n = node as MindmapNode
            return n.type === "problem" ? 6 : keywordRadius(n.degree)
          }}
          nodeLabel={() => ""}
          onNodeClick={(node) => {
            const n = node as MindmapNode
            if (!isConnectMode) {
              if (n.type === "problem") onProblemPick(n.problemId)
              return
            }
            // Connect mode: click-to-click two nodes to link them.
            if (pendingSourceId === null) {
              setPendingSourceId(n.id)
              return
            }
            if (pendingSourceId === n.id) {
              setPendingSourceId(null)
              return
            }
            const source = data.nodes.find((nd) => nd.id === pendingSourceId)
            if (source) onConnect?.(source, n)
            setPendingSourceId(null)
          }}
          onBackgroundClick={() => {
            if (isConnectMode) setPendingSourceId(null)
          }}
          onNodeHover={(node) => {
            const n = node as MindmapNode | null
            const nextId = n?.id ?? null
            setHoveredId(nextId)
            if (!onProblemHover) return
            onProblemHover(n && n.type === "problem" ? n.problemId : null)
          }}
          onRenderFramePost={(ctx) => {
            // Preview line from the pending source to the hovered node.
            if (!isConnectMode || !pendingSourceId || !hoveredId) return
            if (hoveredId === pendingSourceId) return
            const src = data.nodes.find(
              (nd) => nd.id === pendingSourceId,
            ) as PositionedNode | undefined
            const tgt = data.nodes.find(
              (nd) => nd.id === hoveredId,
            ) as PositionedNode | undefined
            if (!src || !tgt) return
            if (src.x === undefined || src.y === undefined) return
            if (tgt.x === undefined || tgt.y === undefined) return
            ctx.save()
            ctx.setLineDash([3, 3])
            ctx.strokeStyle = "rgba(16, 185, 129, 0.85)"
            ctx.lineWidth = 1.4
            ctx.beginPath()
            ctx.moveTo(src.x, src.y)
            ctx.lineTo(tgt.x, tgt.y)
            ctx.stroke()
            ctx.restore()
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as PositionedNode
            if (n.x === undefined || n.y === undefined) return
            const r =
              n.type === "problem"
                ? PROBLEM_RADIUS + 4
                : Math.max(keywordRadius(n.degree) + 2, 5)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(n.x, n.y, r, 0, 2 * Math.PI)
            ctx.fill()
          }}
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as PositionedNode
            if (n.x === undefined || n.y === undefined) return

            const focused = hoveredId === n.id
            const dimmed =
              hoveredId !== null &&
              !focused &&
              !adjacency.get(hoveredId)?.has(n.id)
            const alpha = dimmed ? 0.18 : 1
            const isPendingSource = pendingSourceId === n.id

            if (isPendingSource) {
              const baseR =
                n.type === "problem" ? PROBLEM_RADIUS : keywordRadius(n.degree)
              ctx.beginPath()
              ctx.arc(n.x, n.y, baseR + 5, 0, 2 * Math.PI)
              ctx.strokeStyle = "#10b981"
              ctx.lineWidth = 1.6
              ctx.stroke()
            }

            if (n.type === "problem") {
              const fill = n.categoryColor ?? PROBLEM_DEFAULT_COLOR
              const isCenter = focusedNodeId === n.id
              const radius = isCenter ? PROBLEM_RADIUS * 1.45 : PROBLEM_RADIUS
              // Soft glow (stronger for the focused node)
              ctx.save()
              ctx.shadowColor = applyAlpha(fill, alpha)
              ctx.shadowBlur =
                (isCenter ? 30 : focused ? 22 : 14) * (dimmed ? 0.3 : 1)
              ctx.beginPath()
              ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI)
              ctx.fillStyle = applyAlpha(fill, alpha)
              ctx.fill()
              ctx.restore()
              // Ring (thicker for the focused node)
              ctx.beginPath()
              ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI)
              ctx.strokeStyle = applyAlpha(
                ringColor,
                alpha * (isCenter ? 0.7 : 0.35),
              )
              ctx.lineWidth = isCenter ? 1.2 : 0.6
              ctx.stroke()
              // Label
              const fontSize = Math.max(
                (isCenter ? 12.5 : 11) / globalScale,
                2.6,
              )
              ctx.font = `${isCenter ? 700 : 600} ${fontSize}px ui-sans-serif, system-ui, sans-serif`
              ctx.textAlign = "center"
              ctx.textBaseline = "top"
              ctx.fillStyle = applyAlpha(problemLabelColor, alpha)
              ctx.fillText(truncate(n.label), n.x, n.y + radius + 3)
            } else {
              const r = keywordRadius(n.degree)
              ctx.beginPath()
              ctx.arc(n.x, n.y, r, 0, 2 * Math.PI)
              ctx.fillStyle = applyAlpha(keywordColor, alpha)
              ctx.fill()
              // Label
              const fontSize = Math.max(10 / globalScale, 2.2)
              ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`
              ctx.textAlign = "center"
              ctx.textBaseline = "top"
              ctx.fillStyle = applyAlpha(keywordLabelColor, alpha)
              ctx.fillText(n.label, n.x, n.y + r + 2)
            }
          }}
          linkCanvasObjectMode={() => "replace"}
          linkCanvasObject={(link, ctx) => {
            const src = link.source as PositionedNode | undefined
            const tgt = link.target as PositionedNode | undefined
            if (!src || !tgt || src.x === undefined || tgt.x === undefined) return
            if (src.y === undefined || tgt.y === undefined) return

            const touchesHover =
              hoveredId !== null &&
              (src.id === hoveredId || tgt.id === hoveredId)
            const dimmed = hoveredId !== null && !touchesHover
            const alpha = dimmed ? 0.06 : touchesHover ? 0.7 : 0.32

            const sourceColor = keywordColor
            const targetColor =
              tgt.type === "problem"
                ? tgt.categoryColor ?? PROBLEM_DEFAULT_COLOR
                : keywordColor

            const gradient = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y)
            gradient.addColorStop(0, applyAlpha(sourceColor, alpha))
            gradient.addColorStop(1, applyAlpha(targetColor, alpha))
            ctx.strokeStyle = gradient
            ctx.lineWidth = touchesHover ? 1.2 : 0.7
            ctx.beginPath()
            ctx.moveTo(src.x, src.y)
            ctx.lineTo(tgt.x, tgt.y)
            ctx.stroke()
          }}
        />
      )}
    </div>
  )
}
