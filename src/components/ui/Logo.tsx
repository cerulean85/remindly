export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <radialGradient id="logo-jewel" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
      </defs>

      <rect width="512" height="512" rx="96" fill="url(#logo-bg)" />

      {/* Recall loop: a ring opening at the top */}
      <path
        d="M 321 143 A 130 130 0 1 1 191 143"
        fill="none"
        stroke="#f9fafb"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.92"
      />

      {/* Memory jewel cradled inside the loop */}
      <circle cx="256" cy="256" r="36" fill="url(#logo-jewel)" />
    </svg>
  )
}

export function LogoFull({ iconSize = 28 }: { iconSize?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={iconSize} />
      <span
        className="text-gray-900 dark:text-white tracking-[0.04em]"
        style={{
          fontSize: iconSize * 0.62,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 500,
        }}
      >
        Remindly
      </span>
    </div>
  )
}
