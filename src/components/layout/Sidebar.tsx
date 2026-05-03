"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { NavLinks } from "./NavLinks"
import { LogoFull, LogoMark } from "@/components/ui/Logo"
import { SettingsIcon } from "@/components/ui/Icons"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const SIDEBAR_COLLAPSED_KEY = "layout.sidebarCollapsed"

export function Sidebar({ className }: { className?: string }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored !== "true") return

    let active = true
    queueMicrotask(() => {
      if (active) setCollapsed(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  const toggleLabel = collapsed ? t("nav.expand") : t("nav.collapse")

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 bg-white transition-[width] duration-200 dark:border-neutral-800 dark:bg-black",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-gray-200 dark:border-neutral-800",
          collapsed ? "justify-center px-3" : "justify-between px-4"
        )}
      >
        {collapsed ? <LogoMark size={30} /> : <LogoFull iconSize={30} />}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-100"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <svg
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      <div className={cn("flex flex-1 flex-col gap-4 overflow-y-auto", collapsed ? "p-3" : "p-4")}>
        {session?.user && (
          <div
            className={cn(
              "flex items-center rounded-xl p-2",
              collapsed ? "justify-center" : "gap-3"
            )}
            title={collapsed ? session.user.name ?? session.user.email ?? undefined : undefined}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                {session.user.name?.[0] ?? "U"}
              </div>
            )}
            <div className={cn("min-w-0", collapsed && "sr-only")}>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
        )}

        <NavLinks collapsed={collapsed} />
      </div>

      <div className={cn("border-t border-gray-200 dark:border-neutral-800", collapsed ? "p-3" : "p-4")}>
        <Link
          href="/settings"
          title={collapsed ? t("nav.settings") : undefined}
          className={cn(
            "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            collapsed ? "justify-center" : "gap-3",
            pathname.startsWith("/settings")
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
          )}
        >
          <SettingsIcon className="h-5 w-5 shrink-0" />
          <span className={cn(collapsed && "sr-only")}>{t("nav.settings")}</span>
        </Link>
      </div>
    </aside>
  )
}
