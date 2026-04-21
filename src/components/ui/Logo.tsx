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
          <stop offset="0%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#4338ca"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="110" fill="url(#logo-bg)"/>
      <rect x="148" y="182" width="252" height="178" rx="22" fill="white" opacity="0.25"/>
      <rect x="112" y="200" width="252" height="178" rx="22" fill="white"/>
      <rect x="144" y="232" width="90" height="14" rx="7" fill="#6366f1"/>
      <rect x="144" y="258" width="188" height="10" rx="5" fill="#a5b4fc"/>
      <rect x="144" y="278" width="152" height="10" rx="5" fill="#a5b4fc"/>
      <rect x="144" y="298" width="116" height="10" rx="5" fill="#c7d2fe"/>
      <rect x="144" y="318" width="140" height="10" rx="5" fill="#c7d2fe"/>
      <path
        d="M 342 134 A 58 58 0 1 1 383 218"
        fill="none"
        stroke="white"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M 365 204 L 387 224 L 400 200"
        fill="none"
        stroke="white"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LogoFull({ iconSize = 28 }: { iconSize?: number }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={iconSize} />
      <span
        className="font-bold text-gray-900 dark:text-white tracking-tight"
        style={{ fontSize: iconSize * 0.64 }}
      >
        Remindly
      </span>
    </div>
  )
}
