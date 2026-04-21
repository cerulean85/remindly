"use client"

import { useRef } from "react"

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void, threshold = 50): SwipeHandlers {
  const startX = useRef<number>(0)

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current
      if (dx < -threshold) onSwipeLeft?.()
      else if (dx > threshold) onSwipeRight?.()
    },
  }
}
