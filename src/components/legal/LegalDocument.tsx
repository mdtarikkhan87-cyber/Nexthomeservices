import type { ReactNode } from "react";

// Shared structure for the long-form legal pages (/terms, /privacy), so both
// read the same way and the page files contain only the actual text.

export function LegalDocument({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">{title}</h1>
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">{heading}</h2>
      <div className="mt-4 flex flex-col gap-4 leading-relaxed text-[var(--color-text-secondary)]">{children}</div>
    </section>
  );
}

/** A paragraph, optionally opening with a bold lead-in such as "Account accuracy." */
export function LegalP({ lead, children }: { lead?: string; children: ReactNode }) {
  return (
    <p>
      {lead && <strong className="font-bold text-[var(--color-text-primary)]">{lead} </strong>}
      {children}
    </p>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-[var(--color-text-secondary)]">{children}</ul>;
}

export function LegalItem({ lead, children }: { lead?: string; children: ReactNode }) {
  return (
    <li>
      {lead && <strong className="font-bold text-[var(--color-text-primary)]">{lead} </strong>}
      {children}
    </li>
  );
}

// An answer still owed by the business. The text inside is rendered exactly as
// supplied, "[CLIENT TO CONFIRM: ...]" included — it is only highlighted so it
// can't be missed. Do not remove or reword one until the real answer exists.
export function Pending({ children }: { children: string }) {
  return (
    <mark className="rounded bg-[var(--color-status-pending)]/20 px-1 py-0.5 font-medium text-[var(--color-text-primary)]">
      {children}
    </mark>
  );
}
