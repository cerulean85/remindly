"use client"

import { useQuery } from "@tanstack/react-query"
import type { Problem } from "@/types"

export function useProblem(id: string | null) {
  return useQuery<Problem>({
    queryKey: ["problem", id],
    queryFn: () => fetch(`/api/problems/${id}`).then((r) => r.json()),
    enabled: !!id,
  })
}
