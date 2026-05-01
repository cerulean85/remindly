"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { NavLinks } from "./NavLinks"
import { LogoFull } from "@/components/ui/Logo"
import { SettingsIcon } from "@/components/ui/Icons"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export function Sidebar({ className }: { className?: string }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-neutral-800 dark:bg-black",
        className
      )}
    >
      <div className="flex h-14 items-center px-4 border-b border-gray-200 dark:border-neutral-800">
        <LogoFull iconSize={30} />
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

        <NavLinks />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
        <Link
          href="/settings"
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
  )
}
