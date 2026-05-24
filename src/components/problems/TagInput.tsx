"use client"

import { useState, useRef, useEffect, useMemo, useId, KeyboardEvent } from "react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export type KeywordSuggestion = { keyword: string; count: number }

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  suggestions?: KeywordSuggestion[]
}

const MAX_VISIBLE = 8
const FREQUENT_VISIBLE = 5

function scoreSuggestion(keyword: string, query: string): number | null {
  const k = keyword.toLowerCase()
  const q = query.toLowerCase()
  const idx = k.indexOf(q)
  if (idx < 0) return null
  return idx === 0 ? 0 : 1
}

export function TagInput({
  value,
  onChange,
  placeholder,
  className,
  suggestions = [],
}: TagInputProps) {
  const { t } = useTranslation()
  const listboxId = useId()
  const frequentHeadingId = useId()
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const valueSet = useMemo(() => new Set(value), [value])
  const available = useMemo(
    () => suggestions.filter((s) => !valueSet.has(s.keyword)),
    [suggestions, valueSet],
  )

  const trimmed = input.trim()
  const isFrequentMode = trimmed === ""

  const filtered = useMemo(() => {
    if (isFrequentMode) {
      return available.slice(0, FREQUENT_VISIBLE)
    }
    return available
      .map((s) => ({ s, score: scoreSuggestion(s.keyword, trimmed) }))
      .filter((x): x is { s: KeywordSuggestion; score: number } => x.score !== null)
      .sort(
        (a, b) =>
          a.score - b.score ||
          b.s.count - a.s.count ||
          a.s.keyword.localeCompare(b.s.keyword),
      )
      .slice(0, MAX_VISIBLE)
      .map((x) => x.s)
  }, [available, trimmed, isFrequentMode])

  const shouldShowDropdown = open && filtered.length > 0

  const filteredKey = useMemo(
    () => filtered.map((f) => f.keyword).join("\n"),
    [filtered],
  )
  // Reset highlight whenever the candidate list shifts. Adjusting state during
  // render (per React's "adjusting state on prop change" pattern) avoids the
  // extra commit an effect would introduce.
  const [prevFilteredKey, setPrevFilteredKey] = useState(filteredKey)
  const [selectedIndex, setSelectedIndex] = useState(filteredKey ? 0 : -1)
  if (prevFilteredKey !== filteredKey) {
    setPrevFilteredKey(filteredKey)
    setSelectedIndex(filteredKey ? 0 : -1)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const addTag = (raw: string) => {
    const next = raw.trim()
    if (!next) {
      setInput("")
      return
    }
    if (value.includes(next)) {
      setInput("")
      return
    }
    onChange([...value, next])
    setInput("")
  }

  const addMany = (raw: string) => {
    const newTags = raw
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag && !value.includes(tag))
    if (newTags.length > 0) onChange([...value, ...newTags])
    setInput("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v.includes(",") || v.includes("\n")) {
      addMany(v)
    } else {
      setInput(v)
      if (!open) setOpen(true)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // During an IME composition (e.g. typing Hangul), the browser fires a
    // keydown to commit the composition followed by a second native keydown.
    // Acting on the first one double-adds the trailing character — let the
    // IME finish first, then the real key event will follow.
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return
    if (shouldShowDropdown && e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1))
      return
    }
    if (shouldShowDropdown && e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(0, i - 1))
      return
    }
    if (e.key === "Escape" && open) {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      if (shouldShowDropdown && selectedIndex >= 0) {
        addTag(filtered[selectedIndex].keyword)
      } else {
        addTag(input)
      }
      return
    }
    if (e.key === "Tab" && shouldShowDropdown && selectedIndex >= 0) {
      e.preventDefault()
      addTag(filtered[selectedIndex].keyword)
      return
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text")
    if (text.includes(",") || text.includes("\n")) {
      e.preventDefault()
      addMany(input + text)
    }
  }

  const handleBlur = () => {
    // Defer so a click on a suggestion (which uses preventDefault on mousedown
    // to keep focus) can complete before we collapse the dropdown.
    setTimeout(() => {
      if (containerRef.current?.contains(document.activeElement)) return
      if (input.trim()) addTag(input)
      setOpen(false)
    }, 0)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 min-h-[42px]">
        {value.map((tag) => (
          <Badge key={tag} onRemove={() => onChange(value.filter((t) => t !== tag))}>
            {tag}
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-gray-400"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-autocomplete="list"
          aria-controls={listboxId}
        />
      </div>

      {shouldShowDropdown && (
        <div
          id={listboxId}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg"
          role="listbox"
        >
          {isFrequentMode && (
            <div
              id={frequentHeadingId}
              role="group"
              aria-labelledby={frequentHeadingId}
              className="px-3 py-1.5 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-neutral-800"
            >
              {t("problems.frequentlyUsed")}
            </div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.keyword}
              type="button"
              role="option"
              aria-selected={idx === selectedIndex}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => {
                addTag(item.keyword)
                inputRef.current?.focus()
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                idx === selectedIndex
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-gray-900 dark:text-gray-100"
                  : "text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-800/60",
              )}
            >
              <span className="truncate">{item.keyword}</span>
              <span className="shrink-0 text-xs text-gray-400">· {item.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
