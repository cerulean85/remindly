"use client"

import { useEffect, useRef } from "react"

// Attach a document-level keydown listener for the Escape key while enabled.
// The handler is captured via ref so callers can pass inline arrows without
// thrashing the listener subscription on every render.
export function useEscapeKey(handler: () => void, enabled: boolean = true) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlerRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [enabled])
}
