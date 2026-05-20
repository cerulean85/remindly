"use client"

import { useEffect, useRef, useState } from "react"

type Options = {
  /** Delay before persisting changes to localStorage (ms). */
  debounceMs?: number
  /** If true, do not write the value (used to pause persistence). */
  paused?: boolean
}

/**
 * Mirrors `value` into localStorage under `key` with a debounce. On mount it
 * reads any existing draft so the caller can decide whether to apply it.
 *
 * Returns:
 * - `restored`: the value read from storage on first mount (or null).
 * - `clear()`: removes the stored draft. Call after a successful explicit save.
 */
export function useDraftAutosave<T>(
  key: string | null,
  value: T,
  { debounceMs = 1000, paused = false }: Options = {},
) {
  const [restored, setRestored] = useState<T | null>(null)
  const hydratedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextRef = useRef(false)

  useEffect(() => {
    if (!key) return
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw) as T
        setRestored(parsed)
        skipNextRef.current = true
      }
    } catch {
      // ignore parse errors
    }
    hydratedRef.current = true
  }, [key])

  useEffect(() => {
    if (!key) return
    if (!hydratedRef.current) return
    if (paused) return
    if (skipNextRef.current) {
      skipNextRef.current = false
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // quota or serialization error — skip silently
      }
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [key, value, debounceMs, paused])

  const clear = () => {
    if (!key) return
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }

  return { restored, clear }
}
