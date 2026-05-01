"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  DashboardIcon,
  LearnIcon,
  RetrievalIcon,
  MistakesIcon,
  ProblemsIcon,
  NotesIcon,
} from "@/components/ui/Icons"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import type { ComponentType, SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

const links: { href: string; labelKey: string; Icon: ComponentType<IconProps> }[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", Icon: DashboardIcon },
  { href: "/learn", labelKey: "nav.learn", Icon: LearnIcon },
  { href: "/retrieval", labelKey: "nav.retrieval", Icon: RetrievalIcon },
  { href: "/mistakes", labelKey: "nav.mistakes", Icon: MistakesIcon },
  { href: "/problems", labelKey: "nav.problems", Icon: ProblemsIcon },
  { href: "/notes", labelKey: "nav.notes", Icon: NotesIcon },
]

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, labelKey, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
          )}
        >
          <Icon className="h-5 w-5" />
          {t(labelKey)}
        </Link>
      ))}
    </nav>
  )
}
