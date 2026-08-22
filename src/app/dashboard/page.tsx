"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Button } from "@/components/ui/Button";
import { PropertyCard } from "@/components/property/PropertyCard";
import { IconArrowRight } from "@/components/ui/icons";
import { demoSavedListingIds, mockListings } from "@/lib/mock-data";

const roleTitles: Record<string, string> = {
  landlord: "Landlord Dashboard",
  "tenant-buyer": "Tenant / Buyer Dashboard",
  "service-provider": "Service Provider Dashboard",
  advertiser: "Advertiser Dashboard",
};

const contextCopy = {
  rent: { title: "Renting", verb: "rent", browseHref: "/rent" as const },
  sale: { title: "Buying", verb: "buy", browseHref: "/buy" as const },
};

// DESIGN_SYSTEM.md §4/§12: pending/urgent items always render first, before
// any summary content — this holds regardless of which role is active.
export default function DashboardHome() {
  const { activeRole, roles, setTenantBuyerContext } = useAuth();
  if (!activeRole) return null;

  const current = roles.find((r) => r.role === activeRole);
  const context = current?.context ?? "rent";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          {roleTitles[activeRole]}
          {activeRole === "tenant-buyer" && (
            <span className="ml-2 text-[var(--color-text-secondary)]">— {contextCopy[context].title}</span>
          )}
        </h1>

        {/* Renting/Buying context switcher — same mechanism/spirit as role
            switching (ROLE_EXPERIENCE_AUDIT.md §4 Option C), but this is a
            context on the single Tenant/Buyer role, not a separate role. */}
        {activeRole === "tenant-buyer" && (
          <div className="inline-flex rounded-[var(--radius-control)] bg-[var(--color-surface-dense)] p-1">
            {(["rent", "sale"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setTenantBuyerContext(c)}
                aria-pressed={context === c}
                className={`rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-bold transition-colors ${
                  context === c ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-secondary)]"
                }`}
              >
                {contextCopy[c].title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {current?.state === "pending-admin-document-review" && (
          <StatusBanner
            kind="pending"
            title="Your documents are under review"
            description="You can still browse and manage your other active roles while this is pending — nothing else is restricted."
          />
        )}

        {activeRole === "landlord" && current?.state === "role-verified" && current.subscriptionState === "inactive" && (
          <StatusBanner
            kind="subscription-inactive"
            title="Subscribe to publish a listing"
            description="There's no free listing tier — subscribe to activate your ability to publish."
            action={
              <Link href="/dashboard/subscription">
                <Button size="dense">View plans</Button>
              </Link>
            }
          />
        )}

        {activeRole === "landlord" && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">My Listings</h2>
              <Link
                href="/dashboard/listings"
                className="group inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
              >
                View all
                <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {mockListings.slice(0, 2).map((l) => (
                <PropertyCard key={l.id} listing={l} variant="dashboard" />
              ))}
            </div>
          </section>
        )}

        {activeRole === "tenant-buyer" &&
          (() => {
            // Structural inspiration only (not a clone): a genuinely
            // distinct Renting/Buying workspace, per the Figma reference —
            // implemented with NextHome's real brand tokens and only
            // real, approved data (Saved Homes, live listings). No
            // lease/escrow tracking, offers, financing, or JV pipeline was
            // carried over — none of that exists in the approved PRD.
            const contextListings = mockListings.filter((l) => l.type === context && l.status === "live");
            const savedCount = contextListings.filter((l) => demoSavedListingIds.includes(l.id)).length;
            const recommended = contextListings.filter((l) => !demoSavedListingIds.includes(l.id)).slice(0, 3);

            return (
              <div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                      Saved {contextCopy[context].title.toLowerCase()}
                    </p>
                    <p className="mt-1.5 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{savedCount}</p>
                  </div>
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                      Live listings to {contextCopy[context].verb}
                    </p>
                    <p className="mt-1.5 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{contextListings.length}</p>
                  </div>
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                      Unread messages
                    </p>
                    <p className="mt-1.5 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">0</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Picked for {contextCopy[context].title.toLowerCase()}
                  </h2>
                  <Link
                    href={contextCopy[context].browseHref}
                    className="group inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
                  >
                    Keep browsing
                    <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {recommended.map((l) => (
                    <PropertyCard key={l.id} listing={l} />
                  ))}
                </div>

                <Link
                  href="/dashboard/saved"
                  className="group mt-5 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
                >
                  View Saved Homes ({contextCopy[context].title.toLowerCase()})
                  <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
                </Link>
              </div>
            );
          })()}

        {activeRole === "service-provider" && (
          <p className="text-[var(--color-text-secondary)]">
            Manage your listing and respond to customers from the links on the left.
          </p>
        )}

        {activeRole === "advertiser" && (
          <p className="text-[var(--color-text-secondary)]">
            Ready to reach more visitors?{" "}
            <Link
              href="/dashboard/ads/new"
              className="group inline-flex items-center gap-1 font-bold text-[var(--color-brand-primary)] hover:underline"
            >
              Submit a new ad
              <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
