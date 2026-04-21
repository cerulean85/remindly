import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
  onRemove?: () => void
}

export function Badge({ children, color, className, onRemove }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        !color && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        className
      )}
      style={color ? { backgroundColor: color + "22", color } : undefined}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 leading-none"
        >
          ×
        </button>
      )}
    </span>
  )
}
