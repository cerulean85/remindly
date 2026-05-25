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

export function endpointId(end: MindmapLink["source"]): string | null {
  if (typeof end === "string") return end
  if (end && typeof end === "object" && "id" in end) {
    const v = (end as { id?: unknown }).id
    return typeof v === "string" ? v : null
  }
  return null
}

// Apply the same shape transformation as buildMindmapGraph for a single
// (problemId, keyword) addition, so callers can patch a cached MindmapData
// optimistically without re-fetching. Returns the input unchanged if the
// connection already exists.
export function applyKeywordConnection(
  data: MindmapData,
  problemId: string,
  rawKeyword: string,
): MindmapData {
  const keyword = rawKeyword.trim()
  if (!keyword) return data
  const sourceId = problemNodeId(problemId)
  const sourceNode = data.nodes.find(
    (n) => n.type === "problem" && n.id === sourceId,
  )
  if (!sourceNode) return data

  const nk = norm(keyword)
  // If the keyword matches another problem's title, the canonical graph
  // collapses this into a problem ↔ problem link.
  const matchedProblem = data.nodes.find(
    (n) => n.type === "problem" && n.id !== sourceId && norm(n.label) === nk,
  )

  const linkExists = (a: string, b: string) =>
    data.links.some((l) => {
      const s = endpointId(l.source)
      const t = endpointId(l.target)
      return (s === a && t === b) || (s === b && t === a)
    })

  if (matchedProblem) {
    if (linkExists(sourceId, matchedProblem.id)) return data
    return {
      nodes: data.nodes,
      links: [...data.links, { source: sourceId, target: matchedProblem.id }],
    }
  }

  const kwId = keywordNodeId(keyword)
  if (linkExists(sourceId, kwId)) return data

  const existingKw = data.nodes.find((n) => n.id === kwId)
  if (existingKw && existingKw.type === "keyword") {
    // Bump degree in place: react-force-graph rewrites link source/target to
    // object references pointing at this node, so swapping it for a new object
    // would orphan every other problem still linked to this keyword.
    existingKw.degree += 1
    return {
      nodes: data.nodes,
      links: [...data.links, { source: kwId, target: sourceId }],
    }
  }
  return {
    nodes: [
      ...data.nodes,
      {
        id: kwId,
        type: "keyword",
        keyword,
        label: keyword,
        degree: 1,
      },
    ],
    links: [...data.links, { source: kwId, target: sourceId }],
  }
}

// Inverse of applyKeywordConnection: remove the link a (problemId, keyword)
// pair contributed. Drops a problem ↔ problem link if the keyword matches
// another problem's title, otherwise drops the problem ↔ keyword link and
// either decrements the keyword's degree or removes the now-orphan keyword
// node. Returns the input unchanged if no matching link is present.
export function applyKeywordDisconnect(
  data: MindmapData,
  problemId: string,
  rawKeyword: string,
): MindmapData {
  const keyword = rawKeyword.trim()
  if (!keyword) return data
  const sourceId = problemNodeId(problemId)
  const nk = norm(keyword)

  const matchedProblem = data.nodes.find(
    (n) => n.type === "problem" && n.id !== sourceId && norm(n.label) === nk,
  )

  if (matchedProblem) {
    const filteredLinks = data.links.filter((l) => {
      const s = endpointId(l.source)
      const t = endpointId(l.target)
      return !(
        (s === sourceId && t === matchedProblem.id) ||
        (s === matchedProblem.id && t === sourceId)
      )
    })
    if (filteredLinks.length === data.links.length) return data
    return { nodes: data.nodes, links: filteredLinks }
  }

  const kwId = keywordNodeId(keyword)
  const filteredLinks = data.links.filter((l) => {
    const s = endpointId(l.source)
    const t = endpointId(l.target)
    return !(
      (s === sourceId && t === kwId) || (s === kwId && t === sourceId)
    )
  })
  if (filteredLinks.length === data.links.length) return data

  // Decrement degree in place to preserve the keyword node's reference
  // identity — other links still point at this exact object. We never
  // remove the keyword node here even if it becomes an orphan; the
  // subsequent invalidate from onSettled will reconcile that. Removing
  // a node optimistically destabilizes the running force simulation and
  // can fling nearby nodes off-canvas.
  const existingKw = data.nodes.find(
    (n) => n.id === kwId && n.type === "keyword",
  )
  if (existingKw && existingKw.type === "keyword") {
    existingKw.degree = Math.max(1, existingKw.degree - 1)
  }
  return { nodes: data.nodes, links: filteredLinks }
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
