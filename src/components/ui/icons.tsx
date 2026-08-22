import { SVGProps } from "react";

// Small, self-contained icon set (no new dependency) replacing raw text/emoji
// glyphs (☰ ✕ ★ ☆ ▾ → ✓ ⏳ 🔒 💳) across the app. One consistent stroke
// weight/line style throughout — all icons inherit color via `currentColor`
// so they automatically follow existing brand tokens, never introduce a
// new one.
type IconProps = SVGProps<SVGSVGElement>;

const strokeProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconMenu(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconCreditCard(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M12 3.5c2.2 1.4 4.4 2.1 6.5 2.1v6.1c0 4.1-2.7 7.1-6.5 8.8-3.8-1.7-6.5-4.7-6.5-8.8V5.6c2.1 0 4.3-.7 6.5-2.1Z" />
      <path d="m9 12 2 2 4-4.2" />
    </svg>
  );
}

export function IconMessageCircle(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.3A7.96 7.96 0 0 1 4 12Z" />
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.5 20a1.8 1.8 0 0 0 3 0" />
    </svg>
  );
}

export function IconMegaphone(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l7 4V5L6 9H4a1 1 0 0 0-1 1Z" />
      <path d="M17 8a4 4 0 0 1 0 8" />
    </svg>
  );
}

export function IconStar({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg
      {...strokeProps}
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
      {...props}
    >
      <path d="m12 3 2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.2 6.1-.6L12 3Z" />
    </svg>
  );
}
