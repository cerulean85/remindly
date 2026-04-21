"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const links = [
  { href: "/learn", labelKey: "nav.learn", icon: "📚" },
  { href: "/mistakes", labelKey: "nav.mistakes", icon: "📝" },
  { href: "/problems", labelKey: "nav.problems", icon: "🗂" },
]

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, labelKey, icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          )}
        >
          <span>{icon}</span>
          {t(labelKey)}
        </Link>
      ))}
    </nav>
  )
}
