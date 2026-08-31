"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/notification-context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { IconCheck } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { NIGERIAN_STATES, lgasForState } from "@/lib/nigeria-locations";

const CATEGORIES = ["Electrician", "Plumber", "Mechanic", "Carpenter", "Painter"];

export default function ServiceListingPage() {
  const { roles } = useAuth();
  const providerRole = roles.find((r) => r.role === "service-provider");
  const [submitted, setSubmitted] = useState(false);

  // COVERAGE AREA, not an address: the state this provider works in, plus
  // every LGA inside it they will travel to. Customers filter the directory
  // by LGA, so each ticked box is a search this provider can be found in.
  const [state, setState] = useState("");
  const [lgas, setLgas] = useState<string[]>([]);
  // "The whole state" is a real answer, and its own control rather than
  // making someone tick forty-four boxes to say it. It maps to an empty
  // `lgas` list — see ServiceListing.lgas.
  const [statewide, setStatewide] = useState(false);
  const { notify } = useNotifications();

  const available = lgasForState(state);
  const coverageInvalid = !!state && !statewide && lgas.length === 0;

  const toggleLga = (lga: string) =>
    setLgas((prev) => (prev.includes(lga) ? prev.filter((l) => l !== lga) : [...prev, lga]));

  // PRODUCT_DECISIONS.md §6: submission requires the role itself to be
  // verified, distinct from account-level authentication.
  if (providerRole?.state === "pending-admin-document-review") {
    return (
      <div className="max-w-xl">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Service Listing</h1>
        <StatusBanner
          kind="blocked"
          title="Your Service Provider account is still pending document review"
          description="You'll be able to create your listing once our team approves your documents."
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Service Listing</h1>
        {submitted && <StatusBadge kind="pending" />}
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          // Submitting with a state but no areas would publish a listing that
          // matches no LGA search at all — worse than useless, because the
          // provider would believe they were listed.
          if (coverageInvalid) return; // the message under the fieldset says why
          setSubmitted(true);
          notify({
            role: "service-provider",
            kind: "content-status",
            title: "Service listing submitted",
            body: "Our team is reviewing your service listing before it appears in the directory.",
            href: "/dashboard/service-listing",
            status: "pending",
          });
        }}
      >
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" required>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="svc-state">State you work in</Label>
          <Select
            id="svc-state"
            required
            value={state}
            onChange={(e) => {
              // Coverage is expressed in the LGAs of one state, so changing
              // the state necessarily discards the areas picked under the old
              // one — they do not exist here.
              setState(e.target.value);
              setLgas([]);
              setStatewide(false);
            }}
          >
            <option value="">Select a state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <fieldset disabled={!state} className="disabled:opacity-60">
          <legend className="mb-1.5 block text-sm font-bold text-[var(--color-text-primary)]">
            Areas you cover
          </legend>
          <p className="u-ui mb-3 text-[13px] text-[var(--color-text-secondary)]">
            {state
              ? "Tick every LGA you will travel to. Customers filter the directory by LGA, so each one you tick is a search you appear in."
              : "Choose a state first."}
          </p>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-dense)] px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={statewide}
              onChange={(e) => {
                setStatewide(e.target.checked);
                if (e.target.checked) setLgas([]);
              }}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-[var(--motion-duration-short)] ${
                statewide
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
              }`}
            >
              {statewide && <IconCheck className="h-2.5 w-2.5" />}
            </span>
            <span className="u-ui font-semibold text-[var(--color-text-primary)]">
              I cover the whole state{state ? ` (${available.length} LGAs)` : ""}
            </span>
          </label>

          {/* The LGA list is hidden entirely while "whole state" is ticked:
              leaving forty inert checkboxes on screen would suggest the
              choice still matters when it no longer does. */}
          {!statewide && state && (
            <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="u-ui text-[13px] font-semibold text-[var(--color-text-primary)]">
                  {lgas.length} of {available.length} selected
                </p>
                {lgas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLgas([])}
                    className="u-ui text-[13px] font-bold text-[var(--color-brand-primary-text)] underline underline-offset-2"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="mt-2 grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-2 sm:grid-cols-2">
                {available.map((l) => {
                  const checked = lgas.includes(l);
                  return (
                    <label
                      key={l}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-1.5 text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleLga(l)} className="sr-only" />
                      <span
                        aria-hidden
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-[var(--motion-duration-short)] ${
                          checked
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
                        }`}
                      >
                        {checked && <IconCheck className="h-2.5 w-2.5" />}
                      </span>
                      <span className="u-ui">{l}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {coverageInvalid && (
            <p className="mt-2 text-sm font-medium text-[var(--color-status-rejected)]" role="alert">
              Pick at least one LGA, or tick &ldquo;I cover the whole state&rdquo;.
            </p>
          )}
        </fieldset>

        <div>
          <Label htmlFor="svc-desc">Description</Label>
          <Textarea id="svc-desc" required rows={4} placeholder="Describe your services and coverage area" />
        </div>
        <div>
          <Label htmlFor="svc-contact">Contact details</Label>
          <Input id="svc-contact" required placeholder="Phone number customers can reach you on" />
        </div>
        <Button type="submit" className="self-start">
          {submitted ? "Resubmit" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
