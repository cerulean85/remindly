import { cn } from "@/lib/utils"
import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function svgBase(extra?: string, props?: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
    className: cn("h-5 w-5", extra, props?.className),
  }
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <line x1="4" y1="20" x2="4" y2="10" />
      <line x1="10" y1="20" x2="10" y2="4" />
      <line x1="16" y1="20" x2="16" y2="14" />
      <line x1="22" y1="20" x2="22" y2="8" />
    </svg>
  )
}

export function LearnIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H8a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z" />
      <path d="M22 4.5A1.5 1.5 0 0 0 20.5 3H16a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z" />
    </svg>
  )
}

export function RetrievalIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  )
}

export function MistakesIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <path d="M4 4h12l4 4v12a0 0 0 0 1 0 0H4a0 0 0 0 1 0 0Z" />
      <path d="M16 4v4h4" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  )
}

export function ProblemsIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.39.16.7.42 1 .76 0-.02 0-.02 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <path d="M6 4h12v4a6 6 0 0 1-12 0Z" />
      <path d="M6 6H3a3 3 0 0 0 3 3" />
      <path d="M18 6h3a3 3 0 0 1-3 3" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <path d="M8 21h8l-1-3H9Z" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <polyline points="4 12 10 18 20 6" />
    </svg>
  )
}

export function XIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function HalfCircleIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" />
    </svg>
  )
}

export function NotesIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <path d="M5 4h11l3 3v13a0 0 0 0 1 0 0H5a0 0 0 0 1 0 0Z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="13" y2="18" />
    </svg>
  )
}

export function InboxEmptyIcon(props: IconProps) {
  return (
    <svg {...svgBase(undefined, props)}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  )
}
