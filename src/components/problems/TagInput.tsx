"use client"

import { useState, KeyboardEvent } from "react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [input, setInput] = useState("")

  const addTags = (raw: string) => {
    const newTags = raw
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter((t) => t && !value.includes(t))
    if (newTags.length > 0) onChange([...value, ...newTags])
    setInput("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v.includes(",") || v.includes("\n")) {
      addTags(v)
    } else {
      setInput(v)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTags(input)
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text")
    if (text.includes(",") || text.includes("\n")) {
      e.preventDefault()
      addTags(input + text)
    }
  }

  const handleBlur = () => {
    if (input.trim()) addTags(input)
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 min-h-[42px]",
        className
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} onRemove={() => onChange(value.filter((t) => t !== tag))}>
          {tag}
        </Badge>
      ))}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  )
}
