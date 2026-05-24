export type MindmapNode =
  | {
      id: string
      type: "problem"
      problemId: string
      label: string
      categoryId: string | null
      categoryColor: string | null
    }
  | {
      id: string
      type: "keyword"
      keyword: string
      label: string
      degree: number
    }

export type MindmapLink = { source: string; target: string }

export type MindmapData = { nodes: MindmapNode[]; links: MindmapLink[] }

export type ProblemMindmap = MindmapData & { focusedId: string }

export type ProblemForGraph = {
  id: string
  question: string
  keywords: string[]
  categoryId: string | null
  category: { color: string } | null
}

const norm = (s: string) => s.trim().toLowerCase()

export const problemNodeId = (id: string) => `p:${id}`
export const keywordNodeId = (kw: string) => `k:${kw}`

// A keyword whose text matches another problem's question (case-insensitive,
// trimmed) becomes a direct problem ↔ problem link instead of a separate
// keyword node. This avoids the duplication described by the user: e.g. a
// problem titled "B" plus another problem with keyword "B" would otherwise
// surface as two distinct "B" nodes.
export function buildMindmapGraph(problems: ProblemForGraph[]): MindmapData {
  const titleMap = new Map<string, string[]>()
  for (const p of problems) {
    const key = norm(p.question)
    if (!key) continue
    const arr = titleMap.get(key) ?? []
    arr.push(p.id)
    titleMap.set(key, arr)
  }

  const nodes: MindmapNode[] = []
  const links: MindmapLink[] = []
  const keywordDegree = new Map<string, number>()
  const seenProblemLink = new Set<string>()

  const addProblemLink = (a: string, b: string) => {
    if (a === b) return
    const key = a < b ? `${a}|${b}` : `${b}|${a}`
    if (seenProblemLink.has(key)) return
    seenProblemLink.add(key)
    links.push({ source: problemNodeId(a), target: problemNodeId(b) })
  }

  for (const p of problems) {
    nodes.push({
      id: problemNodeId(p.id),
      type: "problem",
      problemId: p.id,
      label: p.question,
      categoryId: p.categoryId,
      categoryColor: p.category?.color ?? null,
    })
  }

  for (const p of problems) {
    for (const raw of p.keywords) {
      const k = raw.trim()
      if (!k) continue
      const nk = norm(k)
      const matched = titleMap.get(nk) ?? []
      if (matched.length > 0) {
        for (const mid of matched) addProblemLink(p.id, mid)
      } else {
        keywordDegree.set(k, (keywordDegree.get(k) ?? 0) + 1)
        links.push({
          source: keywordNodeId(k),
          target: problemNodeId(p.id),
        })
      }
    }
  }

  for (const [keyword, degree] of keywordDegree) {
    nodes.push({
      id: keywordNodeId(keyword),
      type: "keyword",
      keyword,
      label: keyword,
      degree,
    })
  }

  return { nodes, links }
}

function endpointId(end: MindmapLink["source"]): string | null {
  if (typeof end === "string") return end
  if (end && typeof end === "object" && "id" in end) {
    const v = (end as { id?: unknown }).id
    return typeof v === "string" ? v : null
  }
  return null
}

// Extract the subgraph within `maxHops` of `focusedNodeId`. Keyword-node
// degrees are recomputed against the extracted link set so node sizing
// reflects the local neighborhood rather than the global graph.
export function extractSubgraph(
  graph: MindmapData,
  focusedNodeId: string,
  maxHops: number,
): MindmapData {
  const adj = new Map<string, Set<string>>()
  for (const l of graph.links) {
    const s = endpointId(l.source)
    const t = endpointId(l.target)
    if (!s || !t) continue
    if (!adj.has(s)) adj.set(s, new Set())
    if (!adj.has(t)) adj.set(t, new Set())
    adj.get(s)!.add(t)
    adj.get(t)!.add(s)
  }

  const distance = new Map<string, number>([[focusedNodeId, 0]])
  const queue: string[] = [focusedNodeId]
  while (queue.length) {
    const cur = queue.shift()!
    const d = distance.get(cur)!
    if (d >= maxHops) continue
    for (const next of adj.get(cur) ?? []) {
      if (!distance.has(next)) {
        distance.set(next, d + 1)
        queue.push(next)
      }
    }
  }
  const within = new Set(distance.keys())

  const subKwDegree = new Map<string, number>()
  const subLinks: MindmapLink[] = []
  for (const l of graph.links) {
    const s = endpointId(l.source)
    const t = endpointId(l.target)
    if (!s || !t || !within.has(s) || !within.has(t)) continue
    subLinks.push(l)
    if (s.startsWith("k:")) subKwDegree.set(s, (subKwDegree.get(s) ?? 0) + 1)
    if (t.startsWith("k:")) subKwDegree.set(t, (subKwDegree.get(t) ?? 0) + 1)
  }

  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]))
  const subNodes: MindmapNode[] = []
  for (const id of within) {
    const n = nodesById.get(id)
    if (!n) continue
    if (n.type === "keyword") {
      subNodes.push({ ...n, degree: subKwDegree.get(id) ?? 1 })
    } else {
      subNodes.push(n)
    }
  }

  return { nodes: subNodes, links: subLinks }
}
