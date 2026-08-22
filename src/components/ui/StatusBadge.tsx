import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconCheck, IconClock, IconClose } from "@/components/ui/icons";

// DESIGN_SYSTEM.md §7: one state, one explicit label, always — icon + label,
// never color alone. This is the single component every trust-relevant
// surface in the product routes through, so the account/role/content-item
// state layers (PRODUCT_DECISIONS.md §6) never collapse into one generic look.
export type StatusKind = "verified" | "pending" | "rejected" | "live" | "success" | "sponsored";

const config: Record<StatusKind, { label: string; color: string; icon: ReactNode }> = {
  verified: { label: "Verified", color: "var(--color-status-verified)", icon: <IconCheck className="h-3 w-3" /> },
  live: {
    label: "Live",
    color: "var(--color-status-verified)",
    icon: <span className="h-1.5 w-1.5 rounded-full bg-current" />,
  },
  pending: { label: "Pending Review", color: "var(--color-status-pending)", icon: <IconClock className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "var(--color-status-rejected)", icon: <IconClose className="h-3 w-3" /> },
  success: { label: "Success", color: "var(--color-status-success)", icon: <IconCheck className="h-3 w-3" /> },
  sponsored: {
    label: "Sponsored",
    color: "var(--color-deep-blue)",
    icon: <span className="h-2 w-2 rounded-[2px] bg-current" />,
  },
};

export interface StatusBadgeProps {
  kind: StatusKind;
  /** Override the default label — always keep it specific (DESIGN_SYSTEM.md §14) */
  label?: string;
  dense?: boolean;
  className?: string;
}

export function StatusBadge({ kind, label, dense, className }: StatusBadgeProps) {
  const { label: defaultLabel, color, icon } = config[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold",
        dense ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 22%, transparent)`,
      }}
    >
      <span aria-hidden>{icon}</span>
      {label ?? defaultLabel}
    </span>
  );
}
