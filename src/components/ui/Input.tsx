"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef, LabelHTMLAttributes, ReactNode, useState } from "react";
import { IconEye, IconEyeOff } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

// DESIGN_SYSTEM.md §9: one consistent visual treatment across every form
// in the product; error state is always specific (bound via `error` prop
// by the consumer, never a generic "Invalid input" default).

const fieldBase =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface-raised)] px-4 py-3 text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-[var(--motion-duration-short)] placeholder:text-[var(--color-text-secondary)]/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[var(--color-border-default)] hover:border-[var(--color-deep-blue)]/40 focus:border-[var(--color-brand-accent)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-dark-blue)_12%,transparent)]";

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

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {
  /** Something that sits inside the field at its right-hand end (a button, an icon). */
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, hint, trailing, ...props }, ref) => (
  <div>
    <div className="relative">
      <input
        ref={ref}
        className={cn(fieldBase, error ? "border-[var(--color-status-rejected)]" : "border-[var(--color-border-default)]", trailing ? "pr-12" : undefined, className)}
        aria-invalid={!!error}
        {...props}
      />
      {trailing}
    </div>
    {hint && !error && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{hint}</p>}
    <FieldError error={error} />
  </div>
));
Input.displayName = "Input";

/**
 * A password field with a show/hide button at its end. Use it for EVERY password
 * input, so the behaviour is the same everywhere: hidden by default, the eye
 * toggles the input between type="password" and type="text" (the value, the
 * autofill attributes and form submission are untouched — only `type` changes),
 * and the button is a real <button>, so it is reachable by Tab and works with
 * Enter and Space. Its label says what pressing it will do.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "trailing">>((props, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          // A tap on the eye shouldn't blur the field (and close a phone keyboard).
          onMouseDown={(e) => e.preventDefault()}
          className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-deep-blue)]"
        >
          {visible ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
        </button>
      }
    />
  );
});
PasswordInput.displayName = "PasswordInput";

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
