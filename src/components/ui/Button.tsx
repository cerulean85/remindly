import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-[background-color,box-shadow,color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-emerald-500 text-white shadow-card hover:bg-emerald-600 hover:shadow-card-hover focus-visible:ring-emerald-500/30": variant === "primary",
            "bg-surface-elevated text-text-primary border border-border-default shadow-card hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:shadow-card-hover focus-visible:ring-emerald-500/30": variant === "secondary",
            "text-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-text-primary focus-visible:ring-emerald-500/30": variant === "ghost",
            "bg-red-500 text-white shadow-card hover:bg-red-600 hover:shadow-card-hover focus-visible:ring-red-500/30": variant === "danger",
            "min-h-11 px-4 py-2 text-sm": size === "sm",
            "min-h-12 px-5 py-2.5 text-base": size === "md",
            "min-h-14 px-7 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
