"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { DrawerOverlay } from "@/components/layout/DrawerOverlay"
import { DrawerContext, useDrawerState } from "@/hooks/useDrawer"
import { useDrawer } from "@/hooks/useDrawer"
import { LogoFull } from "@/components/ui/Logo"

function TopBar() {
  const { toggle } = useDrawer()
  return (
    <header className="flex h-14 items-center px-4 border-b border-gray-200 dark:border-neutral-800 md:hidden bg-white dark:bg-black">
      <button
        onClick={toggle}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mr-3"
        aria-label="Open menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <LogoFull iconSize={26} />
    </header>
  )
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="hidden md:flex" />
      <DrawerOverlay />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const drawerState = useDrawerState()
  return (
    <DrawerContext.Provider value={drawerState}>
      <AppShellInner>{children}</AppShellInner>
    </DrawerContext.Provider>
  )
}
