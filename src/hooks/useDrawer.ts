"use client"

import { createContext, useContext, useState } from "react"

interface DrawerContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const DrawerContext = createContext<DrawerContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
})

export function useDrawer() {
  return useContext(DrawerContext)
}

export function useDrawerState(): DrawerContextValue {
  const [isOpen, setIsOpen] = useState(false)
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  }
}
