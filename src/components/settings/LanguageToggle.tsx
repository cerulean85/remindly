"use client"

import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import "@/lib/i18n"

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith("en") ? "en" : "ko"

  return (
    <div className="flex gap-2">
      {(["ko", "en"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-sm font-medium border transition-colors",
            current === lang
              ? "bg-emerald-500 text-white border-emerald-500"
              : "border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
          )}
        >
          {lang === "ko" ? "한국어" : "English"}
        </button>
      ))}
    </div>
  )
}
