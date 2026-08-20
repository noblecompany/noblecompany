/** 공용 스트로크 아이콘 — 이모지 대신 쓰는 16~18px SVG (색은 currentColor 상속) */

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

interface IconProps {
  size?: number;
  className?: string;
}

export function IconLock({ size = 18, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function IconClip({ size = 15, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="m21 12-8.4 8.4a5.5 5.5 0 0 1-7.8-7.8L13 4.4a3.7 3.7 0 0 1 5.2 5.2L10 17.8a1.9 1.9 0 0 1-2.7-2.7L15 7.5" />
    </svg>
  );
}

export function IconCheck({ size = 15, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconX({ size = 15, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconMinus({ size = 15, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}
