"use client"

import { useEffect } from "react"

/**
 * While `isDirty` is true, the browser will warn before unload (refresh / close
 * / external navigation). For in-app navigation, callers should still wrap
 * their own back / link handlers with confirm() — Next.js does not expose a
 * synchronous router navigation hook.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])
}
