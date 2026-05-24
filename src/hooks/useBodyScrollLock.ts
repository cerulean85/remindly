"use client"

import { useEffect } from "react"

// Lock body scroll while `locked` is true. Restores the previous value on
// release so nested locks don't clobber each other.
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}
