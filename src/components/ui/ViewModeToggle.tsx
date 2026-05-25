"use client"

import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import type { ViewMode } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ mode, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex shrink-0 overflow-hidden rounded-full border border-border-default bg-surface-elevated">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label={t("problems.viewGrid")}
        title={t("problems.viewGrid")}
        className={cn(
          "px-3 py-2 text-sm transition-colors",
          mode === "grid"
            ? "bg-emerald-500 text-white"
            : "text-text-secondary hover:bg-black/[0.04] dark:hover:bg-surface-elevated/[0.06]",
        )}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label={t("problems.viewList")}
        title={t("problems.viewList")}
        className={cn(
          "px-3 py-2 text-sm transition-colors",
          mode === "list"
            ? "bg-emerald-500 text-white"
            : "text-text-secondary hover:bg-black/[0.04] dark:hover:bg-surface-elevated/[0.06]",
        )}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>
    </div>
  )
}
