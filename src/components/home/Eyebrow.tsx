// The small uppercase label above each section title (same `u-label` role as
// "Browse by"). A short Blue rule carries the brand Blue; the text itself is
// Deep Blue, because Blue (#0492C2) at 11px measures 3.6:1 on white and 3.2:1
// on Off-white, under the 4.5:1 AA floor. Flip `text-` to Blue here if the
// client wants the label itself in Blue.
export function Eyebrow({ children, onDark = false }: { children: string; onDark?: boolean }) {
  return (
    <p
      className={`u-label inline-flex items-center gap-2.5 ${
        onDark ? "text-[var(--color-brand-accent)]" : "text-[var(--color-brand-primary-text)]"
      }`}
    >
      <span
        aria-hidden
        className={`h-0.5 w-6 rounded-full ${
          onDark ? "bg-[var(--color-brand-accent)]" : "bg-[var(--color-brand-primary)]"
        }`}
      />
      {children}
    </p>
  );
}
