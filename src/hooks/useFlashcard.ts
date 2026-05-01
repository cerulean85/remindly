"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Problem } from "@/types"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface FlashcardOptions {
  limit?: number | null
  timerSeconds?: number
}

export function useFlashcard(problems: Problem[], options: FlashcardOptions = {}) {
  const { limit = null, timerSeconds = 0 } = options

  const [deck, setDeck] = useState<Problem[]>(() => {
    const shuffled = shuffle(problems)
    return limit ? shuffled.slice(0, limit) : shuffled
  })
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const flippedRef = useRef(false)
  const [timeLeft, setTimeLeft] = useState(timerSeconds)

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
    async (action?: "skip" | "blurry" | "vivid") => {
      if (current && action) {
        fetch(`/api/mistakes/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }).catch(() => {})
      }
      setIsFlipped(false)
      flippedRef.current = false
      setIndex((i) => i + 1)
    },
    [current]
  )

  const prev = useCallback(() => {
    setIsFlipped(false)
    flippedRef.current = false
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const restart = useCallback(() => {
    const shuffled = shuffle(problems)
    setDeck(limit ? shuffled.slice(0, limit) : shuffled)
    setIndex(0)
    setIsFlipped(false)
    flippedRef.current = false
    setTimeLeft(timerSeconds)
  }, [problems, limit, timerSeconds])

  useEffect(() => {
    if (timerSeconds === 0 || !current || isComplete) return
    setTimeLeft(timerSeconds)

    const id = setInterval(() => {
      if (flippedRef.current) return
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id)
          Promise.resolve().then(() => next("skip"))
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [current, timerSeconds, isComplete, next])

  return {
    current,
    index,
    total: deck.length,
    isFlipped,
    isComplete,
    timeLeft,
    flip,
    next,
    prev,
    restart,
  }
}
