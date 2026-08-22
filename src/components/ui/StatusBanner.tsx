import { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";
import { IconClock, IconClose, IconCreditCard, IconLock } from "@/components/ui/icons";

// DESIGN_SYSTEM.md §14: pending/rejected/blocked/subscription-inactive are
// first-class, persistent states (never a toast), and must remain visually
// distinct from one another — never a single generic banner differentiated
// only by color (DESIGN_SYSTEM.md §7's account/role/content-item layering).
export type BannerKind = "pending" | "rejected" | "blocked" | "subscription-inactive";

const config: Record<BannerKind, { Icon: ComponentType<SVGProps<SVGSVGElement>>; color: string }> = {
  pending: { Icon: IconClock, color: "var(--color-status-pending)" },
  rejected: { Icon: IconClose, color: "var(--color-status-rejected)" },
  blocked: { Icon: IconLock, color: "var(--color-deep-blue)" },
  "subscription-inactive": { Icon: IconCreditCard, color: "var(--color-deep-blue)" },
};

export function StatusBanner({
  kind,
  title,
  description,
  action,
  className,
}: {
  kind: BannerKind;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const { Icon, color } = config[kind];
  return (
    <div
      className={cn("relative overflow-hidden rounded-[var(--radius-card)] border p-4 pl-5 shadow-[var(--elevation-xs)]", className)}
      style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 6%, var(--color-surface-raised))` }}
      role="status"
    >
      {/* Accent bar — a considered alert convention (color-coded edge +
          icon chip) rather than a flat tinted box. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color }} />
        </span>
        <div className="flex-1 pt-0.5">
          <p className="font-bold" style={{ color }}>
            {title}
          </p>
          {description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
