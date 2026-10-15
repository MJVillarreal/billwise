export function LogoIcon({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M8 5a3 3 0 0 1 3-3h13l9 9v22a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z" fill="#4f6bff" />
      <path d="M24 2v6a3 3 0 0 0 3 3h6Z" fill="#9db0ff" />
      <rect x="12.5" y="14" width="11" height="2.6" rx="1.3" fill="#fff" />
      <rect x="12.5" y="19.5" width="13" height="2.6" rx="1.3" fill="#fff" />
      <rect x="12.5" y="25" width="7" height="2.6" rx="1.3" fill="#fff" />
      <path
        d="M31 24.5c.5 3.4 1.6 4.5 5 5-3.4.5-4.5 1.6-5 5-.5-3.4-1.6-4.5-5-5 3.4-.5 4.5-1.6 5-5Z"
        fill="#4f6bff"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoIcon className="size-8" />
      <span className="text-xl font-bold tracking-tight">
        <span className={inverted ? 'text-white' : 'text-navy'}>Bill</span>
        <span className="text-brand">wise</span>
      </span>
    </span>
  );
}
