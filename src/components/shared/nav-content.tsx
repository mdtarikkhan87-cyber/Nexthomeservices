"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { IconCheck, IconShield } from "@/components/ui/icons";
import { MenuButton, MenuDivider, MenuLabel, MenuLink } from "@/components/shared/NavMenu";
import { useAuth } from "@/lib/auth-context";
import { browseFacets } from "@/lib/browse-facets";
import { roleDisplay, roleLandingHref } from "@/lib/roles";
import type { RoleName } from "@/lib/types";

// What goes inside the header's menus, in one place, so the desktop dropdowns
// and the mobile sheet are built from the same lists and cannot drift apart.
//
// Every destination below is an existing route or query param:
//   /listings?mode=rent | sale      the Rent/Buy toggle on the Listings page
//   /listings?mode=rent&state=…     the landing page's "Browse by" cards
//   /listings?mode=rent&duration=…  the Short-Term / Long-Term filter
//   /listings?verified=1            the "Verified listings only" filter
//   /help                           "Help & FAQ" (the product's only FAQ page)
//   /#how-it-works                  the landing page's trust-process section
//   /dashboard, /admin, /account    the account destinations
//
// Left out because no page or section exists for them: "Contact". (Feedback and
// Report a Concern exist, but they are forms, not a contact page.)

export const MORE_LINKS = [
  { href: "/#how-it-works", label: "How it works", description: "The checks behind every listing" },
  { href: "/listings?verified=1", label: "Verified listings", description: "Only landlords we have checked" },
  { href: "/help", label: "FAQs", description: "Answers to common questions" },
] as const;

/** Every listing is reviewed before it goes live — said once, in the menu footer. */
export function ReviewNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-sm font-medium text-[var(--color-text-body)] ${className}`}>
      <IconShield aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]" />
      Every listing is reviewed before it goes live.
    </p>
  );
}

const homes = (n: number) => `${n} home${n === 1 ? "" : "s"}`;

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

/** The Listings mega-menu body: Browse · Browse by location · Stay length. */
export function ListingsMenuContent() {
  const { states, durations } = browseFacets();
  return (
    <div className="grid max-h-[calc(100dvh-8rem)] gap-x-4 gap-y-5 overflow-y-auto p-4 md:grid-cols-2 md:p-5 lg:grid-cols-3">
      <div role="group" aria-label="Browse">
        <MenuLabel>Browse</MenuLabel>
        <MenuLink href="/listings?mode=rent" label="Rent" description="Homes to rent" />
        <MenuLink href="/listings?mode=sale" label="Buy" description="Homes for sale" />
        <MenuLink href="/listings" label="All listings" description="Everything, newest first" />
      </div>

      <div role="group" aria-label="Browse by location">
        <MenuLabel>Browse by location</MenuLabel>
        {states.map((s) => (
          <MenuLink key={s.key} href={s.href} label={s.label} meta={homes(s.count)} />
        ))}
      </div>

      <div role="group" aria-label="Stay length" className="md:col-span-2 lg:col-span-1">
        <MenuLabel>Stay length</MenuLabel>
        {durations.map((d) => (
          <MenuLink key={d.key} href={d.href} label={`${d.label} rentals`} meta={homes(d.count)} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu (secondary links)
// ---------------------------------------------------------------------------

export function MoreMenuContent({ pathname }: { pathname: string }) {
  return (
    <div className="p-2">
      {MORE_LINKS.map((l) => (
        <MenuLink key={l.href} href={l.href} label={l.label} description={l.description} active={l.href === pathname} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/**
 * Dashboard · Switch role (only with more than one role) · Profile · Log out.
 *
 * Nothing here changes how auth or roles work. It calls the same functions the
 * header's role switcher does: `setActiveRole`, then a push to that role's
 * landing page (RoleSwitcher.tsx explains why the navigation lives with the
 * control rather than inside setActiveRole), and the same two gates — an admin
 * has no roles to switch between, and one role is not a choice.
 *
 * `inMenu` is false in the mobile sheet, which is a plain list, not a menu.
 */
export function AccountItems({ inMenu = true }: { inMenu?: boolean }) {
  const { user, roles, activeRole, setActiveRole, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const isAdmin = !!user.isAdmin;
  const canSwitchRole = !isAdmin && user.roles.length >= 2 && !!activeRole;

  const switchTo = (role: RoleName) => {
    if (role === activeRole) return;
    setActiveRole(role);
    router.push(roleLandingHref(role));
  };

  return (
    <>
      {/* Admin has no /dashboard (it renders nothing without an activeRole,
          which admin never has), so the first entry is its own overview. */}
      <MenuLink
        inMenu={inMenu}
        href={isAdmin ? "/admin" : "/dashboard"}
        label={isAdmin ? "Admin overview" : "Dashboard"}
      />

      {canSwitchRole && (
        <div role={inMenu ? "group" : undefined} aria-label="Switch role">
          <MenuDivider />
          <MenuLabel>Switch role</MenuLabel>
          {roles.map((r) => {
            const current = r.role === activeRole;
            return (
              <MenuButton key={r.role} inMenu={inMenu} checked={current} onSelect={() => switchTo(r.role)}>
                <span className="flex-1">{roleDisplay(r.role, r.context)}</span>
                {current && <IconCheck aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-deep-blue)]" />}
              </MenuButton>
            );
          })}
          <MenuDivider />
        </div>
      )}

      {/* Admin has no roles to manage on /account either. */}
      {!isAdmin && <MenuLink inMenu={inMenu} href="/account" label="Profile" />}

      <MenuButton inMenu={inMenu} tone="danger" onSelect={logout}>
        Log out
      </MenuButton>
    </>
  );
}

/** Name and current role, above the account list. */
export function AccountHeader() {
  const { user, roles, activeRole } = useAuth();
  if (!user) return null;
  const held = roles.find((r) => r.role === activeRole);
  const line = user.isAdmin ? "Admin" : held ? `Viewing as ${roleDisplay(held.role, held.context)}` : "";
  return (
    <div className="border-b border-[var(--color-border-hairline)] px-5 py-3">
      <p className="truncate text-[15px] font-bold text-[var(--color-dark-blue)]">{user.name}</p>
      {line && <p className="mt-0.5 text-[13px] font-medium text-[var(--color-text-body)]">{line}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile sheet
// ---------------------------------------------------------------------------

function SheetSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="px-3 pb-2 pt-3" aria-label={label}>
      <MenuLabel>{label}</MenuLabel>
      {children}
    </section>
  );
}

/** Everything the desktop menus offer, as one scrolling sheet of 48px targets. */
export function MobileSheetContent({
  pathname,
  isAuthenticated,
  loggedOutActions,
}: {
  pathname: string;
  isAuthenticated: boolean;
  loggedOutActions: ReactNode;
}) {
  const { states, durations } = browseFacets();
  return (
    <div className="pb-2">
      <SheetSection label="Listings">
        <MenuLink inMenu={false} href="/listings?mode=rent" label="Rent" description="Homes to rent" />
        <MenuLink inMenu={false} href="/listings?mode=sale" label="Buy" description="Homes for sale" />
        <MenuLink inMenu={false} href="/listings" label="All listings" description="Everything, newest first" />
      </SheetSection>

      <SheetSection label="Browse by location">
        <div className="grid grid-cols-2 gap-x-1">
          {states.map((s) => (
            <MenuLink key={s.key} inMenu={false} href={s.href} label={s.label} description={homes(s.count)} />
          ))}
        </div>
      </SheetSection>

      <SheetSection label="Stay length">
        <div className="grid grid-cols-2 gap-x-1">
          {durations.map((d) => (
            <MenuLink key={d.key} inMenu={false} href={d.href} label={d.label} description={homes(d.count)} />
          ))}
        </div>
      </SheetSection>

      <SheetSection label="More">
        {MORE_LINKS.map((l) => (
          <MenuLink
            key={l.href}
            inMenu={false}
            href={l.href}
            label={l.label}
            description={l.description}
            active={l.href === pathname}
          />
        ))}
      </SheetSection>

      <div className="mx-3 border-t border-[var(--color-border-hairline)] pt-3">
        {isAuthenticated ? <AccountItems inMenu={false} /> : loggedOutActions}
      </div>

      <ReviewNote className="px-6 pb-3 pt-4" />
    </div>
  );
}
