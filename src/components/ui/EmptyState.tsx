import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// COMPONENT_ARCHITECTURE.md §2: always takes explicit content props — never
// a default "Nothing here" message. Every call site must supply its own
// screen-specific copy (DESIGN_SYSTEM.md §14).
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-dense)]/50 px-6 py-14 text-center",
        className
      )}
    >
      <span aria-hidden className="h-1.5 w-10 rounded-full bg-[var(--color-brand-accent)]/50" />
      <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">{title}</p>
      {description && <p className="max-w-md text-[var(--color-text-secondary)]">{description}</p>}
      {action}
    </div>
  );
}
