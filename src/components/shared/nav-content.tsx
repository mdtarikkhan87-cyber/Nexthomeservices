"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { IconCheck } from "@/components/ui/icons";
import { MenuButton, MenuDivider, MenuLabel, MenuLink } from "@/components/shared/NavMenu";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { roleDisplay, roleLandingHref } from "@/lib/roles";
import type { RoleName } from "@/lib/types";

// What goes inside the header's menus, in one place, so the desktop dropdowns
// and the mobile sheet are built from the same lists and cannot drift apart.
//
// Every destination below is an existing route or query param:
//   /listings?mode=rent | sale      the Rent/Buy toggle on the Listings page
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

// The Listings menu is just these three links, on desktop and in the mobile
// sheet alike. (It used to also offer "Browse by location" and "Stay length"
// columns, with a subtitle under each link; the destinations still exist on the
// Listings page and the landing page, they are simply no longer in the menu.)
const LISTINGS_LINKS = [
  { href: "/listings?mode=rent", label: "Rent" },
  { href: "/listings?mode=sale", label: "Buy" },
  { href: "/listings", label: "All listings" },
] as const;

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

/** The Listings menu body: Rent · Buy · All listings. */
export function ListingsMenuContent() {
  return (
    <div role="group" aria-label="Listings" className="p-2">
      {LISTINGS_LINKS.map((l) => (
        <MenuLink key={l.href} href={l.href} label={l.label} />
      ))}
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
  const { unreadCount } = useNotifications();
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

      {/* Admin has no role-scoped notification feed (it returns [] without an
          activeRole), so the entry is for everyone else. */}
      {!isAdmin && (
        <MenuLink
          inMenu={inMenu}
          href="/dashboard/notifications"
          label="Notifications"
          meta={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        />
      )}

      <MenuButton inMenu={inMenu} tone="danger" onSelect={logout}>
        Log out
      </MenuButton>
    </>
  );
}

/** "Signed in as" name and email (as in the existing account menu), then the current role. */
export function AccountHeader() {
  const { user, roles, activeRole } = useAuth();
  if (!user?.name) return null;
  const held = roles.find((r) => r.role === activeRole);
  const line = user.isAdmin ? "Admin" : held ? `Viewing as ${roleDisplay(held.role, held.context)}` : "";
  return (
    <div className="border-b border-[var(--color-border-hairline)] px-5 py-3">
      <p className="text-xs font-medium text-[var(--color-text-body)]">Signed in as</p>
      <p className="truncate text-[15px] font-bold text-[var(--color-dark-blue)]">{user.name}</p>
      <p className="truncate text-[13px] font-medium text-[var(--color-text-body)]" title={user.email}>
        {user.email}
      </p>
      {line && <p className="mt-1 text-[13px] font-medium text-[var(--color-text-body)]">{line}</p>}
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
  /** Omit (or pass null) when the header bar already shows Log in / Register,
      so the two never appear on screen together. */
  loggedOutActions?: ReactNode;
}) {
  return (
    <div className="pb-2">
      <SheetSection label="Listings">
        {LISTINGS_LINKS.map((l) => (
          <MenuLink key={l.href} inMenu={false} href={l.href} label={l.label} />
        ))}
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

      {(isAuthenticated || loggedOutActions) && (
        <div className="mx-3 border-t border-[var(--color-border-hairline)] pt-3">
          {isAuthenticated ? <AccountItems inMenu={false} /> : loggedOutActions}
        </div>
      )}
    </div>
  );
}
