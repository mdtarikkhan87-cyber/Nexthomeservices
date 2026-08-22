import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// DESIGN_SYSTEM.md §8: exactly one primary (filled, brand-primary) action
// per screen/section; secondary = outlined/text; destructive = distinct
// error color, never brand blue. Density (dashboard) shrinks size, never
// the color-coded hierarchy.
//
// VISUAL REFINEMENT: primary/secondary now carry a resting elevation that
// deepens by one step on hover (a considered depth cue, not a bounce/scale
// effect) — same brand colors, more deliberate materiality.
type Variant = "primary" | "secondary" | "destructive" | "text";
type Size = "default" | "dense";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-primary)] text-white shadow-[var(--elevation-xs)] hover:bg-[var(--color-brand-primary-hover)] hover:shadow-[var(--elevation-sm)] disabled:opacity-50 disabled:shadow-none",
  secondary:
    "border border-[var(--color-deep-blue)] text-[var(--color-deep-blue)] hover:bg-[var(--color-surface-dense)] hover:shadow-[var(--elevation-xs)] disabled:opacity-50",
  destructive:
    "bg-transparent border border-[var(--color-status-rejected)] text-[var(--color-status-rejected)] hover:bg-[var(--color-status-rejected)] hover:text-white disabled:opacity-50",
  text: "text-[var(--color-brand-primary)] hover:underline disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  default: "px-5 py-2.5 text-base",
  dense: "px-3 py-1.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-bold transition-[background-color,box-shadow,color]",
          "duration-[var(--motion-duration-short)]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
