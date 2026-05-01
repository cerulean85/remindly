"use client"

import { useEffect } from "react"
import { useDrawer } from "@/hooks/useDrawer"
import { NavLinks } from "./NavLinks"
import { SettingsIcon, XIcon } from "@/components/ui/Icons"
import { LogoFull } from "@/components/ui/Logo"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export function DrawerOverlay() {
  const { isOpen, close } = useDrawer()
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t } = useTranslation()

  useEffect(() => {
    close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-black shadow-xl transition-transform duration-300 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200 dark:border-neutral-800">
          <LogoFull iconSize={26} />
          <button
            onClick={close}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label={t("common.close")}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
          {session?.user && (
            <div className="flex items-center gap-3 rounded-xl p-2">
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
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
            </div>
          )}
          <NavLinks onNavigate={close} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
          <Link
            href="/settings"
            onClick={close}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
            )}
          >
            <SettingsIcon className="h-5 w-5" />
            {t("nav.settings")}
          </Link>
        </div>
      </aside>
    </>
  )
}
