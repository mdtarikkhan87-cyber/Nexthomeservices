import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef, LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// DESIGN_SYSTEM.md §9: one consistent visual treatment across every form
// in the product; error state is always specific (bound via `error` prop
// by the consumer, never a generic "Invalid input" default).

const fieldBase =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface-raised)] px-4 py-3 text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-[var(--motion-duration-short)] placeholder:text-[var(--color-text-secondary)]/60 hover:border-[var(--color-deep-blue)]/40 focus:border-[var(--color-brand-accent)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-dark-blue)_12%,transparent)]";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1.5 block text-sm font-bold text-[var(--color-text-primary)]", className)} {...props} />
);

export interface FieldWrapperProps {
  error?: string;
  hint?: string;
}

export const FieldError = ({ error }: { error?: string }) =>
  error ? (
    <p className="mt-1.5 text-sm font-medium text-[var(--color-status-rejected)]" role="alert">
      {error}
    </p>
  ) : null;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, hint, ...props }, ref) => (
  <div>
    <input
      ref={ref}
      className={cn(fieldBase, error ? "border-[var(--color-status-rejected)]" : "border-[var(--color-border-default)]", className)}
      aria-invalid={!!error}
      {...props}
    />
    {hint && !error && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{hint}</p>}
    <FieldError error={error} />
  </div>
));
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, hint, ...props }, ref) => (
  <div>
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-28 resize-y", error ? "border-[var(--color-status-rejected)]" : "border-[var(--color-border-default)]", className)}
      aria-invalid={!!error}
      {...props}
    />
    {hint && !error && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{hint}</p>}
    <FieldError error={error} />
  </div>
));
Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, hint, children, ...props }, ref) => (
  <div>
    <select
      ref={ref}
      className={cn(fieldBase, "appearance-none bg-no-repeat", error ? "border-[var(--color-status-rejected)]" : "border-[var(--color-border-default)]", className)}
      aria-invalid={!!error}
      {...props}
    >
      {children}
    </select>
    {hint && !error && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{hint}</p>}
    <FieldError error={error} />
  </div>
));
Select.displayName = "Select";
