"use client"

import { useState, useCallback, useRef } from "react"
import type { Problem } from "@/types"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useFlashcard(problems: Problem[]) {
  const [deck, setDeck] = useState<Problem[]>(() => shuffle(problems))
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const flippedRef = useRef(false)

  const current = deck[index] ?? null
  const isComplete = deck.length > 0 && index >= deck.length

  const flip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev
      flippedRef.current = next || flippedRef.current
      return next
    })
  }, [])

  const next = useCallback(
    async (action?: "skip" | "know") => {
      if (current && action === "skip") {
        fetch(`/api/mistakes/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "skip" }),
        }).catch(() => {})
      }
      setIsFlipped(false)
      flippedRef.current = false
      setIndex((i) => i + 1)
    },
    [current]
  )

  const markHint = useCallback(() => {
    if (!current) return
    fetch(`/api/mistakes/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hint" }),
    }).catch(() => {})
  }, [current])

  const prev = useCallback(() => {
    setIsFlipped(false)
    flippedRef.current = false
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const restart = useCallback(() => {
    setDeck(shuffle(problems))
    setIndex(0)
    setIsFlipped(false)
    flippedRef.current = false
  }, [problems])

  return { current, index, total: deck.length, isFlipped, isComplete, flip, next, prev, markHint, restart }
}
