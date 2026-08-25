"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select } from "@/components/ui/Input";
import { IconArrowRight } from "@/components/ui/icons";
import { mockServices } from "@/lib/mock-data";
import {
  NIGERIAN_STATES,
  coversLga,
  coversWholeState,
  formatCoverage,
  isLgaInState,
  lgasForState,
} from "@/lib/nigeria-locations";

// The card treatment below is unchanged from the previous flat list — only
// a category filter was added in front of it, so the directory stays
// scannable as more trades are added rather than growing into one long
// undifferentiated grid. Chips reuse the SearchBar tab pill styling
// (brand-primary when selected, dense surface on hover) rather than
// introducing a new control.
export function ServiceDirectory() {
  const categories = useMemo(() => Array.from(new Set(mockServices.map((s) => s.category))).sort(), []);

  // Seeded from the URL so the homepage Services search actually lands on a
  // filtered directory. Validated against the real category list — an
  // unknown ?category= falls back to "all" rather than rendering an empty
  // grid the chips give no way to escape.
  const searchParams = useSearchParams();
  const requested = searchParams.get("category") ?? "";
  const [category, setCategory] = useState<string>(
    categories.includes(requested) ? requested : ""
  );

  // Location, on the same two-level model as the property filters: a state,
  // and an LGA scoped to it. Both are validated on the way in for the same
  // reason as the category — a hand-edited or stale link must not apply a
  // filter the controls cannot display.
  const [state, setState] = useState<string>(() => {
    const s = searchParams.get("state") ?? "";
    return NIGERIAN_STATES.includes(s) ? s : "";
  });
  const [lga, setLga] = useState<string>(() => {
    const s = searchParams.get("state") ?? "";
    const l = searchParams.get("lga") ?? "";
    return NIGERIAN_STATES.includes(s) && isLgaInState(s, l) ? l : "";
  });

  // Changing the state drops the LGA with it — an LGA belongs to exactly one
  // state, so keeping it would leave a filter applied that this state's list
  // cannot even offer.
  const changeState = (next: string) => {
    setState(next);
    setLga("");
  };

  // The LGA test is "do you cover here?", not "are you based here?" — a
  // provider lists every LGA they will travel to, and a statewide provider
  // matches every LGA in their state. See ServiceListing.lgas.
  const results = useMemo(
    () =>
      mockServices.filter(
        (s) =>
          (!category || s.category === category) &&
          (!state || s.state === state) &&
          (!lga || coversLga(s.lgas, lga)),
      ),
    [category, state, lga],
  );

  const FIELD_LABEL =
    "u-ui mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]";

  const chipClass =
    "u-ui inline-flex shrink-0 items-center rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)]";

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by service category">
        {[{ value: "", label: "All services" }, ...categories.map((c) => ({ value: c, label: c }))].map((chip) => (
          <button
            key={chip.value || "all"}
            onClick={() => setCategory(chip.value)}
            aria-pressed={category === chip.value}
            className={`${chipClass} ${
              category === chip.value
                ? "bg-[var(--color-brand-primary)] text-white shadow-[var(--elevation-xs)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Location filters sit under the category chips, in the same order as
          the property sidebar — State, then the LGA it scopes — so a visitor
          who has used one filter surface already knows this one. Selects
          rather than chips: 37 states and up to 44 LGAs cannot be a chip row.

          COVERAGE CAVEAT: a provider is listed at one base LGA, so filtering
          to an LGA can hide a trade who would happily travel there. That is
          a property of the data model (see ServiceListing.lga), not of this
          control, and it is why the LGA filter is optional and never
          pre-applied. */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:max-w-xl sm:grid-cols-2">
        <div>
          <label className={FIELD_LABEL} htmlFor="svc-state">
            State
          </label>
          <Select id="svc-state" value={state} onChange={(e) => changeState(e.target.value)}>
            <option value="">Any state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className={FIELD_LABEL} htmlFor="svc-lga">
            Local Government Area
          </label>
          <Select id="svc-lga" value={lga} disabled={!state} onChange={(e) => setLga(e.target.value)}>
            <option value="">{state ? "Any LGA" : "Select a state first"}</option>
            {lgasForState(state).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="u-ui mt-6 text-[13px] font-semibold text-[var(--color-text-secondary)]">
        <span className="u-numeric text-[var(--color-text-primary)]">{results.length}</span> provider{results.length !== 1 ? "s" : ""}
        {state && <> covering {lga ? `${lga}, ${state}` : state}</>}
      </p>

      {/* A location filter can genuinely empty this directory — there are far
          fewer providers than LGAs. Saying so, and offering the way back, is
          the difference between "nothing here" and "nothing matches what you
          asked for". */}
      {results.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          No providers match that filter yet.{" "}
          <button
            type="button"
            onClick={() => {
              setCategory("");
              changeState("");
            }}
            className="font-bold text-[var(--color-brand-primary-text)] underline underline-offset-2"
          >
            Clear filters
          </button>
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {results.map((s) => (
          <Link
            key={s.id}
            href={`/services/${s.id}`}
            className="group flex gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 transition-colors duration-[var(--motion-duration-standard)] hover:border-[var(--color-brand-primary)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-lg font-bold text-[var(--color-brand-primary)]">
              {s.category[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="u-label text-[var(--color-brand-primary-text)]">{s.category}</span>
                {s.verified && <StatusBadge kind="verified" dense />}
              </div>
              <p className="mt-1.5 font-bold text-[var(--color-text-primary)]">{s.providerName}</p>
              {/* Coverage, not an address. Statewide providers say so; the
                  rest name the first areas and count the remainder, so the
                  line stays one line however many LGAs are listed. */}
              <p className="u-ui mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
                {coversWholeState(s.lgas) && (
                  <span aria-hidden className="mr-1">
                    ◎
                  </span>
                )}
                {formatCoverage(s.state, s.lgas)}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{s.description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-primary-text)] opacity-0 transition-opacity duration-[var(--motion-duration-short)] group-hover:opacity-100">
                View details
                <IconArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
