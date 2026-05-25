"use client"

import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import type { Category } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  showCounts?: boolean
}

export function CategoryFilterBar({ categories, selectedId, onSelect, showCounts = false }: Props) {
  const { t } = useTranslation()
  if (categories.length === 0) return null
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
          selectedId === null
            ? "bg-emerald-500 text-white border-emerald-500"
            : "border-border-default text-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        )}
      >
        {t("problems.allCategories")}
      </button>
      {categories.map((cat) => {
        const active = selectedId === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              active
                ? "bg-emerald-500 text-white border-emerald-500"
                : "border-border-default text-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
            )}
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: active ? "white" : cat.color }}
            />
            {cat.name}
            {showCounts && cat._count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-black/[0.06] dark:bg-white/[0.08] text-text-tertiary",
                )}
              >
                {cat._count.problems}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
