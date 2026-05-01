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
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500": variant === "primary",
            "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700 focus-visible:ring-gray-400": variant === "secondary",
            "hover:bg-gray-100 dark:hover:bg-neutral-800 focus-visible:ring-gray-400": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500": variant === "danger",
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
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
