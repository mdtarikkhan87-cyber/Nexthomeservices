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

// Mirror of IconArrowRight. Used by the header's back-to-homepage control —
// the one place in the app that moves the user *backwards*, so it gets the
// same arrow, reversed, rather than a chevron (which reads as "expand" here,
// IconChevronDown's job).
export function IconArrowLeft(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
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

export function IconBed(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M3 19V6" />
      <path d="M3 15h18v4" />
      <path d="M21 15v-2.5A2.5 2.5 0 0 0 18.5 10H11v5" />
      <circle cx="7" cy="11.5" r="1.75" />
    </svg>
  );
}

export function IconBath(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M3 12h18v2.5a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 14.5V12Z" />
      <path d="M6 12V6.5A2.5 2.5 0 0 1 8.5 4 2.5 2.5 0 0 1 11 6.5" />
      <path d="M7 19l-1 2M17 19l1 2" />
    </svg>
  );
}

export function IconPause(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M8 5v14M16 5v14" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M7 4.5v15l12-7.5z" />
    </svg>
  );
}

export function IconExternalLink(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconWrench(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7V20h3.3l5.3-5.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
    </svg>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconHelp(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconReply(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="m9 17-5-5 5-5M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <svg {...strokeProps} aria-hidden="true" {...props}>
      <path d="M17.94 17.94A10.1 10.1 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </svg>
  );
}
