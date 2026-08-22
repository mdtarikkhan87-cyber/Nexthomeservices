import { cn } from "@/lib/utils";

// DESIGN_SYSTEM.md §14: explicit loading indicator on any network-dependent
// action — never a silently unresponsive UI.
export function Loader({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-6 text-[var(--color-text-secondary)]", className)} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
