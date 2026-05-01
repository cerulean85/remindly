"use client"

import { cn } from "@/lib/utils"

const COLORS = [
  "#10b981", "#22c55e", "#14b8a6", "#3b82f6",
  "#06b6d4", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#64748b", "#78716c",
]

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-7 w-7 rounded-full transition-transform hover:scale-110",
            value === color && "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110"
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
