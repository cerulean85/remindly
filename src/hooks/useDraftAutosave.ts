"use client"

import { useEffect, useRef } from "react"

type Options = {
  /** Delay before persisting changes to localStorage (ms). */
  debounceMs?: number
  /** If true, do not write the value (used to pause persistence). */
  paused?: boolean
}

// Pure read — call inside a `useState(() => readInitialDraft(...))` so the
// component initializes from the draft on first render with no extra effect.
export function readInitialDraft<T>(key: string | null): T | null {
  if (!key || typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore parse errors
  }
  return null
}

/**
 * Mirrors `value` into localStorage under `key` with a debounce.
 * Companion to `readInitialDraft` — read once on mount, then call this to
 * keep the store in sync as the user types.
 *
 * `clear()` removes the stored draft. Call after a successful explicit save.
 */
export function useDraftAutosave<T>(
  key: string | null,
  value: T,
  { debounceMs = 1000, paused = false }: Options = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!key || paused) return
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

  return { clear }
}
