"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const themes = [
  { value: "light", labelKey: "settings.themeLight" },
  { value: "dark", labelKey: "settings.themeDark" },
  { value: "system", labelKey: "settings.themeSystem" },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <div className="flex gap-2">
      {themes.map(({ value, labelKey }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-sm font-medium border transition-colors",
            theme === value
              ? "bg-emerald-500 text-white border-emerald-500"
              : "border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
          )}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
