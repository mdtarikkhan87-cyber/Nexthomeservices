"use client";

import { useRouter } from "next/navigation";
import { IconCheck, IconShield } from "@/components/ui/icons";
import { MenuButton, MenuDivider, MenuLabel, MenuLink } from "@/components/shared/NavMenu";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { ROLE_LABELS, roleDisplay, roleLandingHref } from "@/lib/roles";
import type { RoleName } from "@/lib/types";

// What goes inside the header's menus, in one place, so the desktop dropdowns
// and the mobile sheet are built from the same lists and cannot drift apart.
//
// Every destination below is an existing route or query param:
//   /listings?mode=rent | sale      the Rent/Buy toggle on the Listings page
//   /listings#f-state               the State filter at the top of the Listings filters
//   /listings?mode=rent&duration=…  the Short-Term / Long-Term filter
//   /listings?verified=1            the "Verified listings only" filter
//   /services                       the Find Home Services directory
//   /dashboard/listings/new         List Your Property (see MAIN_MENU_GROUPS)
//   /verification                   How Verification Works
//   /complaints                     Report a Concern
//   /help                           "Help & FAQ" (the product's only FAQ page)
//   /dashboard, /admin, /account    the account destinations
//
// Left out because no page or section exists for them: "Contact". (Feedback and
// Report a Concern exist, but they are forms, not a contact page.)

// The main menu (the desktop "Menu" dropdown and the phone/tablet hamburger
// sheet are built from this one list). Three groups, in this order:
//
//   (unlabelled)     Discover Properties · Find Home Services · List Your Property
//   Trust & Safety   How Verification Works · Report a Concern
//   Support          Help & FAQ
//
// What the old menu held, and where it went:
//   How it works        -> How Verification Works (the dedicated page)
//   FAQs                -> Help & FAQ
//   Verified listings   -> the "Verified listings only" filter on /listings
//   Rent / Buy / All    -> the Rent/Buy toggle on /listings (Discover Properties);
//                          the desktop "Listings" dropdown still lists them
//
// "List Your Property" is the same destination for everyone: the dashboard's
// new-listing page already shows a signed-out visitor the login gate (and
// returns them), offers a signed-in non-landlord "Add the Landlord role", and
// opens the form for a landlord.
export const MAIN_MENU_GROUPS: {
  label?: string;
  links: { href: string; label: string }[];
}[] = [
  {
    links: [
      { href: "/listings", label: "Discover Properties" },
      { href: "/services", label: "Find Home Services" },
      { href: "/dashboard/listings/new", label: "List Your Property" },
    ],
  },
  {
    label: "Trust & Safety",
    links: [
      { href: "/verification", label: "How Verification Works" },
      { href: "/complaints", label: "Report a Concern" },
    ],
  },
  {
    label: "Support",
    links: [{ href: "/help", label: "Help & FAQ" }],
  },
];

function MainMenuGroups({ inMenu, pathname }: { inMenu: boolean; pathname: string }) {
  return (
    <>
      {MAIN_MENU_GROUPS.map((group, i) => (
        <div key={group.label ?? "main"} role={inMenu ? "group" : undefined} aria-label={group.label}>
          {i > 0 && <MenuDivider />}
          {group.label && <MenuLabel>{group.label}</MenuLabel>}
          {group.links.map((l) => (
            <MenuLink key={l.href} inMenu={inMenu} href={l.href} label={l.label} active={l.href === pathname} />
          ))}
        </div>
      ))}
    </>
  );
}

/** Every listing is reviewed before it goes live — said once, in the menu footer. */
export function ReviewNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-sm font-medium text-[var(--color-text-body)] ${className}`}>
      <IconShield aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]" />
      Every listing is reviewed before it goes live.
    </p>
  );
}

// Location links are live data on the landing page (fetched server-side), which
// the header cannot see without a request of its own — so the menu points at
// that section instead of listing states, and shows no counts.
const STAY_LENGTH = [
  { href: "/listings?mode=rent&duration=short-term", label: "Short-Term rentals" },
  { href: "/listings?mode=rent&duration=long-term", label: "Long-Term rentals" },
] as const;

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

/** The Listings menu body: Browse · Browse by location · Stay length. */
export function ListingsMenuContent() {
  return (
    <div className="grid max-h-[calc(100dvh-8rem)] gap-x-4 gap-y-5 overflow-y-auto p-4 md:grid-cols-2 md:p-5 lg:grid-cols-3">
      <div role="group" aria-label="Browse">
        <MenuLabel>Browse</MenuLabel>
        <MenuLink href="/listings?mode=rent" label="Rent" />
        <MenuLink href="/listings?mode=sale" label="Buy" />
        <MenuLink href="/listings" label="All listings" />
      </div>

      <div role="group" aria-label="Browse by location">
        <MenuLabel>Browse by location</MenuLabel>
        <MenuLink href="/listings#f-state" label="Choose a location" description="Filter listings by state and area" />
      </div>

      <div role="group" aria-label="Stay length" className="md:col-span-2 lg:col-span-1">
        <MenuLabel>Stay length</MenuLabel>
        {STAY_LENGTH.map((d) => (
          <MenuLink key={d.href} href={d.href} label={d.label} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu (the main menu)
// ---------------------------------------------------------------------------

export function MoreMenuContent({ pathname }: { pathname: string }) {
  return (
    <div className="p-2">
      <MainMenuGroups inMenu pathname={pathname} />
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

/**
 * Who is signed in: the name, the email under it, and a small badge for the
 * account type — but only where the badge says something the rest of the menu
 * doesn't. That is an admin ("Administrator": an admin holds no roles, so
 * nothing else would say so) and a user with exactly one role. A user with
 * several roles gets no badge: the "Switch role" list below already marks the
 * active role with a check, and stating it twice is how the two drift apart.
 *
 * "Signed in as" is kept for screen readers (visually hidden), so what is
 * announced is unchanged.
 */
export function AccountHeader() {
  const { user } = useAuth();
  if (!user?.name) return null;
  const badge = user.isAdmin ? "Administrator" : user.roles.length === 1 ? ROLE_LABELS[user.roles[0]] : null;
  return (
    <div className="border-b border-[var(--color-border-hairline)] px-5 py-3">
      <p className="truncate text-[15px] font-bold text-[var(--color-dark-blue)]">
        <span className="sr-only">Signed in as </span>
        {user.name}
      </p>
      {user.email && (
        <p className="truncate text-[13px] font-medium text-[var(--color-text-body)]" title={user.email}>
          {user.email}
        </p>
      )}
      {badge && (
        <p className="mt-2">
          <span className="inline-block max-w-full truncate rounded-full bg-[var(--color-surface-dense)] px-2.5 py-0.5 align-top text-xs font-bold text-[var(--color-text-secondary)]">
            {badge}
          </span>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile sheet
// ---------------------------------------------------------------------------

/** The site navigation, as one scrolling sheet of 48px targets (the hamburger
    menu on phones and tablets). Account controls are NOT here — see
    MobileAccountPanel. */
export function MobileSheetContent({ pathname }: { pathname: string }) {
  return (
    <div className="pb-2">
      <div className="px-3 pt-3">
        <MainMenuGroups inMenu={false} pathname={pathname} />
      </div>

      <ReviewNote className="px-6 pb-3 pt-4" />
    </div>
  );
}

/** The signed-in account panel on phones and tablets (opened by the profile
    button next to the hamburger): who is signed in and as which role, List Your
    Property for an acting Landlord, Dashboard, Switch role, Profile,
    Notifications and Log out. Desktop has the same content in its avatar menu. */
export function MobileAccountPanel({ canListProperty = false }: { canListProperty?: boolean }) {
  return (
    <div className="pb-2">
      <AccountHeader />
      <div className="px-3 pt-2">
        {canListProperty && <MenuLink inMenu={false} href="/dashboard/listings/new" label="List Your Property" />}
        <AccountItems inMenu={false} />
      </div>
    </div>
  );
}
