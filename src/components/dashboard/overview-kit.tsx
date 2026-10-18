"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconArrowRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

// The building blocks of the four role overviews, so they share one look:
// greeting header → stat tiles → cards (attention list, tables, side cards).
// Everything is brand tokens (Deep Blue / Blue / Light Blue and tints made from
// them with color-mix); the only other colours are the existing status ones.

// ---------------------------------------------------------------------------
// Tones: the tinted square behind an icon, a dot, a count chip.
// ---------------------------------------------------------------------------
export type Tone = "info" | "pending" | "rejected" | "neutral";

const TONE: Record<Tone, { tile: string; chip: string }> = {
  // Blue on a Light Blue wash.
  info: {
    tile: "bg-[color-mix(in_srgb,var(--color-light-blue)_26%,white)] text-[var(--color-blue)]",
    chip: "bg-[color-mix(in_srgb,var(--color-light-blue)_26%,white)] text-[var(--color-deep-blue)]",
  },
  // Deep Blue wash: "waiting on someone" (the product's pending colour).
  pending: {
    tile: "bg-[color-mix(in_srgb,var(--color-deep-blue)_12%,white)] text-[var(--color-deep-blue)]",
    chip: "bg-[color-mix(in_srgb,var(--color-deep-blue)_12%,white)] text-[var(--color-deep-blue)]",
  },
  rejected: {
    tile: "bg-[color-mix(in_srgb,var(--color-status-rejected)_12%,white)] text-[var(--color-status-rejected)]",
    chip: "bg-[color-mix(in_srgb,var(--color-status-rejected)_12%,white)] text-[var(--color-status-rejected)]",
  },
  neutral: {
    tile: "bg-[var(--color-surface-dense)] text-[var(--color-text-secondary)]",
    chip: "bg-[var(--color-surface-dense)] text-[var(--color-text-secondary)]",
  },
};

export function IconTile({ tone = "info", size = 36, children }: { tone?: Tone; size?: 32 | 36 | 40 | 56; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-[10px]", TONE[tone].tile)}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Header: date, greeting, one line of status, and the actions.
// ---------------------------------------------------------------------------

// The date and the time of day only exist in the browser, so they come from a
// store that answers "" on the server — the greeting then fills in after
// hydration instead of mismatching it.
const subscribeNever = () => () => {};
function timeSnapshot(): string {
  const now = new Date();
  const h = now.getHours();
  const part = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const date = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return `${part}|${date}`;
}
const serverSnapshot = () => "";

export function OverviewHeader({
  name,
  summary,
  actions,
}: {
  name: string | undefined;
  /** One short sentence under the greeting; null while it is still unknown. */
  summary: string | null;
  actions?: ReactNode;
}) {
  const t = useSyncExternalStore(subscribeNever, timeSnapshot, serverSnapshot);
  const [part, date] = t ? t.split("|") : ["", ""];
  const first = name?.split(" ")[0];
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
        <p className="min-h-[1.25rem] text-[13px] font-bold tracking-wide text-[var(--color-text-secondary)]">{date}</p>
        <h1 className="text-[26px] font-bold leading-8 tracking-tight text-[var(--color-text-primary)] sm:text-[32px] sm:leading-10">
          {part ? `Good ${part}${first ? `, ${first}` : ""}` : first ? `Welcome, ${first}` : "Welcome"}
        </h1>
        <p className="min-h-6 text-[15px] leading-6 text-[var(--color-text-secondary)]">{summary ?? " "}</p>
      </div>
      {actions && (
        // On a phone the actions are one scrolling row that bleeds to the edges
        // (so they never wrap into a tall stack); from sm they wrap beside the greeting.
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {actions}
        </div>
      )}
    </header>
  );
}

const BTN = "inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-colors duration-[var(--motion-duration-short)]";

export function PrimaryAction({ href, icon, children }: { href: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className={cn(BTN, "bg-[var(--color-deep-blue)] text-white hover:bg-[color-mix(in_srgb,var(--color-deep-blue)_86%,black)]")}>
      {icon}
      {children}
    </Link>
  );
}

/** A compact Deep Blue button for the main action inside a card or an empty state. */
export function PrimaryLink({ href, children, block = false }: { href: string; children: ReactNode; block?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-deep-blue)] px-4 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[color-mix(in_srgb,var(--color-deep-blue)_86%,black)]",
        block && "w-full",
      )}
    >
      {children}
    </Link>
  );
}

export function SecondaryAction({ href, icon, children, count }: { href: string; icon?: ReactNode; children: ReactNode; count?: number }) {
  return (
    <Link
      href={href}
      className={cn(
        BTN,
        "border border-[color-mix(in_srgb,var(--color-deep-blue)_24%,white)] bg-[var(--color-surface-raised)] text-[var(--color-deep-blue)] hover:border-[color-mix(in_srgb,var(--color-blue)_55%,white)] hover:bg-[color-mix(in_srgb,var(--color-light-blue)_12%,white)]",
      )}
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span className="u-numeric flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[var(--color-blue)] px-[7px] text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Stat tiles
// ---------------------------------------------------------------------------
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]">
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  note,
  icon,
  href,
}: {
  label: string;
  /** null while loading: a skeleton shows, never an invented 0. */
  value: number | null;
  note?: string;
  icon: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold leading-4 text-[var(--color-text-secondary)] sm:text-[13px] sm:leading-5">{label}</h2>
        <IconTile tone="info" size={32}>
          {icon}
        </IconTile>
      </div>
      {value === null ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="u-numeric text-[26px] font-bold leading-8 tracking-tight text-[var(--color-text-primary)] sm:text-[32px] sm:leading-10">
          {new Intl.NumberFormat("en-NG").format(value)}
        </p>
      )}
      {note && value !== null && <p className="text-xs text-[var(--color-text-secondary)]">{note}</p>}
    </>
  );
  const cls =
    "flex flex-col gap-2 rounded-2xl border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-4 sm:gap-3 sm:px-6 sm:py-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-[border-color,box-shadow] duration-[var(--motion-duration-short)] hover:border-[color-mix(in_srgb,var(--color-blue)_40%,white)] hover:shadow-[var(--elevation-sm)]")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
export function Card({ children, className, labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn("flex min-w-0 flex-col rounded-2xl border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)]", className)}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  id,
  title,
  subtitle,
  count,
  href,
  linkLabel = "View all",
  padded = true,
}: {
  id: string;
  title: string;
  subtitle?: string;
  /** A small amber-less count chip next to the title ("Needs attention 5"). */
  count?: number;
  href?: string;
  linkLabel?: string;
  padded?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-1", padded && "p-4 pb-2 sm:p-6 sm:pb-3")}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id={id} className="flex items-center gap-2 text-lg font-bold leading-7 text-[var(--color-text-primary)] sm:text-xl">
          {title}
          {count !== undefined && count > 0 && (
            <span className={cn("u-numeric flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold", TONE.pending.chip)}>{count}</span>
          )}
        </h2>
        {subtitle && <p className="text-[13px] text-[var(--color-text-secondary)]">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--color-brand-primary)] hover:underline">
          {linkLabel}
          <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export interface AttentionItem {
  key: string;
  tone: Tone;
  icon: ReactNode;
  title: string;
  meta: string;
  cta: string;
  href: string;
}

/** "Needs attention": each row says what, why, and has one button. Every row is
    derived from the account's real data by the caller. */
export function AttentionCard({ items, loading, className }: { items: AttentionItem[]; loading: boolean; className?: string }) {
  return (
    <Card labelledBy="attn-h" className={cn("p-4 sm:p-6", className)}>
      <CardHeader id="attn-h" title="Needs attention" count={items.length} padded={false} />
      {loading ? (
        <div className="mt-3 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 border-t border-[var(--color-border-hairline)] pt-3">
              <Skeleton className="h-9 w-9" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 flex items-center gap-3 border-t border-[var(--color-border-hairline)] pt-4 text-sm text-[var(--color-text-secondary)]">
          <IconTile tone="info">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </IconTile>
          You&rsquo;re all caught up — nothing needs your attention right now.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {items.map((a) => (
            <li key={a.key} className="flex items-center gap-3 border-t border-[var(--color-border-hairline)] py-3 first:border-t-0 sm:items-center">
              <IconTile tone={a.tone}>{a.icon}</IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-2 text-sm font-bold text-[var(--color-text-primary)]">{a.title}</span>
                <span className="text-[13px] leading-[18px] text-[var(--color-text-secondary)]">{a.meta}</span>
              </div>
              <Link
                href={a.href}
                className="flex h-9 shrink-0 items-center rounded-[10px] border border-[color-mix(in_srgb,var(--color-deep-blue)_24%,white)] px-3 text-[13px] font-bold text-[var(--color-deep-blue)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[color-mix(in_srgb,var(--color-light-blue)_12%,white)]"
              >
                {a.cta}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** A person's initials in a tinted circle (enquiries, leads). */
export function Initials({ name, size = 40 }: { name: string; size?: 40 | 48 }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-light-blue)_26%,white)] text-sm font-bold text-[var(--color-deep-blue)]"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export const ROW = "border-t border-[var(--color-border-hairline)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[color-mix(in_srgb,var(--color-light-blue)_8%,white)]";
