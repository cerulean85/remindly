"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type Serializer<T> = {
  parse: (raw: string) => T | undefined
  stringify: (value: T) => string
}

export const booleanSerializer: Serializer<boolean> = {
  parse: (raw) => (raw === "true" ? true : raw === "false" ? false : undefined),
  stringify: (v) => String(v),
}

export function enumSerializer<T extends string>(
  values: readonly T[],
): Serializer<T> {
  const allowed = new Set<string>(values)
  return {
    parse: (raw) => (allowed.has(raw) ? (raw as T) : undefined),
    stringify: (v) => v,
  }
}

// Persist a single value in localStorage. Hydrates once on mount via
// queueMicrotask to keep the initial server/client render in sync, then
// writes through on every setter call.
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  serializer: Serializer<T>,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue)
  // Capture the serializer in a ref so callers can pass inline factories
  // without re-subscribing the hydration effect. This deliberate ref write
  // during render is safe — serializer functions are pure and idempotent.
  const serializerRef = useRef(serializer)
  // eslint-disable-next-line react-hooks/refs
  serializerRef.current = serializer

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(key)
    if (raw === null) return
    const parsed = serializerRef.current.parse(raw)
    if (parsed === undefined) return
    let active = true
    queueMicrotask(() => {
      if (active) setValue(parsed)
    })
    return () => {
      active = false
    }
  }, [key])

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const nextValue =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serializerRef.current.stringify(nextValue))
        }
        return nextValue
      })
    },
    [key],
  )

  return [value, set]
}
