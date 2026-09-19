"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconArrowLeft, IconBell, IconChevronDown, IconClose, IconMenu } from "@/components/ui/icons";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { roleDisplay } from "@/lib/roles";

// ===========================================================================
// NAV REDUCTION (Website Revision Spec §3A, 24 Aug 2026)
// ===========================================================================
// Before: Home · Rent · Buy · Services · Help · List Your Property · Log in ·
//         Register — eight top-level items, which is what the client meant by
//         "the site's purpose gets diluted".
//
// After, per the spec verbatim ("Top nav reduces to exactly three items:
// Listings, Log in, Register"):
//
//   Listings   — one destination, replacing Rent + Buy (they merged; §3C)
//   Log in     — plain text link
//   Register   — the one solid, brand-filled control in the bar
//
// Removed as top-level items, and where each went instead:
//   Home            → the logo IS the home link (spec §3A). Not deleted, just
//                     no longer a labelled item competing with Listings.
//   Rent / Buy      → one Listings route with a toggle (§3C).
//   Services / Help → still routed, still reachable, now from the footer.
//                     ⚠ Their exact destination is Spec §4 item 1, still
//                     pending — the footer is where they already lived
//                     alongside the top nav, so relocating rather than
//                     inventing a new home for them is the smallest honest
//                     move. Easy to change when the client confirms.
//   List Your       → role-gated (§3A): shown only to a signed-in user whose
//   Property          ACTIVE role is Landlord. See the comment at its site.
//
// This supersedes INFORMATION_ARCHITECTURE.md's "Global/Public Navigation"
// subsection wholesale, and amends PRODUCT_DECISIONS.md §9's "Post Property
// CTA — always visible" rule. Both are recorded in REVISION_LOG.md rather than
// changed silently.
// ===========================================================================

/** The whole primary nav, now. One item, by design. */
const PRIMARY_LINKS = [{ href: "/listings", label: "Listings" }];

/**
 * Section-aware active state. /listing/:id (a property detail page) belongs to
 * the Listings section without sharing its path prefix, so it is matched
 * explicitly — otherwise the nav stops answering "where am I?" exactly when
 * the user is deepest in the site.
 */
function isListingsSection(pathname: string) {
  return (
    pathname === "/listings" ||
    pathname.startsWith("/listings/") ||
    pathname.startsWith("/listing/") ||
    // The compatibility shims redirect, but a mid-redirect render should not
    // flash an unhighlighted nav.
    pathname === "/rent" ||
    pathname === "/buy" ||
    pathname === "/search"
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Authenticated destinations, shared by the desktop account menu and the
// mobile drawer so the two can never drift out of sync. Log out is
// deliberately NOT in this list — it is an action, not a destination, and is
// rendered separately below its own divider.
const ACCOUNT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/account", label: "Account & roles" },
];

// Admin has none of the above: no role-dashboard (dashboard/layout.tsx
// renders nothing without an activeRole, which admin never has), no
// role-scoped notification feed (notification-context.tsx returns [] with
// no activeRole), and no roles to manage on /account. Pointing an admin at
// any of those is a dead, blank page — so it gets its own single-item list
// instead of reusing ACCOUNT_LINKS.
const ADMIN_ACCOUNT_LINKS = [{ href: "/admin", label: "Admin overview" }];

export function Header() {
  const { user, isAuthenticated, roles, activeRole, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // §3A: "List Your Property ... only appears once a user is registered with,
  // and currently acting as, the Landlord role — it is a role-gated nav item,
  // not a public one."
  //
  // Both halves are required: holding the role is not enough, the role has to
  // be the ACTIVE one. That is what makes the persistent switcher meaningful —
  // switching to Landlord is what puts this control in the bar.
  //
  // Because it can now only be seen by an acting Landlord, the ProtectedLink
  // auth-intercept it used to need is gone: there is no anonymous visitor left
  // to intercept. It is a plain link to a plain destination.
  const canListProperty = isAuthenticated && activeRole === "landlord";
  const accountLinks = user?.isAdmin ? ADMIN_ACCOUNT_LINKS : ACCOUNT_LINKS;

  // BACK-TO-HOME ARROW. The logo has been the only route home since the nav
  // reduction above, and an unlabelled logo is an *implicit* affordance — it
  // works once you know it, which is not the same as being discoverable. This
  // adds the explicit one, on every route except the homepage itself (where
  // it would point at the page you are already on).
  //
  // It is a Link to "/", not router.back(): "back" in browser history is
  // wherever the user happened to come from, which is frequently not this
  // site's homepage at all. A fixed destination is the one that can be
  // labelled honestly.
  //
  // Deliberately icon-only. A labelled "Home" control would re-introduce the
  // exact top-level item spec §3A removed; the accessible name and tooltip
  // carry the meaning instead.
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-6 sm:px-6">
        {/* Tight gap here (was 6/8) because this cluster is now up to three
            controls deep on a phone — menu, back, logo. The nav's breathing
            room moved onto the nav itself as an explicit margin, so it does
            not have to be paid for by the icons too. */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="-ml-1.5 flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-deep-blue)] md:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>

          {!isHome && (
            <Link
              href="/"
              aria-label="Back to homepage"
              title="Back to homepage"
              // Bordered rather than bare: it sits directly beside the logo,
              // which is also a link to "/", so it has to read as a control in
              // its own right instead of as part of the mark.
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-brand-primary)] sm:h-11 sm:w-11"
            >
              <IconArrowLeft className="h-[18px] w-[18px]" />
            </Link>
          )}

          {/* THE HOME LINK (spec §3A: "The site logo / name in the header
              becomes the click target that returns the user to the homepage,
              replacing a dedicated 'Home' nav label").
              It already linked home; what changes is that it is now the ONLY
              way home from the nav, so its accessible name says so explicitly
              and it carries aria-current on the homepage — a labelled nav item
              gets both for free, an unlabelled logo has to be given them.

              Official NextHome Primary Logo, extracted pixel-for-pixel from
              the approved Brand Guidelines PDF (p.3). Intrinsic width/height
              keep the aspect ratio locked; only display height is set. Brand
              identity is untouched.

              SIZE, 9 Sep 2026: h-9 -> h-12, and h-14 from sm up. Asset and
              position are untouched; the bar keeps its original py-2.5.

              A pass earlier that day swapped this for the landscape secondary
              lockup, reasoning that a portrait mark cannot show a readable
              wordmark in a header row. The client looked at it and asked for
              the primary lockup back, in its original placement, only bigger.
              That is what this is, and the swap is recorded in REVISION_LOG.md
              §16a rather than deleted, because the constraint behind it is
              still live:

              THE WORDMARK IN THIS MARK IS NOT LEGIBLE AND CANNOT BE. Height
              buys width on a portrait lockup — even at h-14 this renders only
              ~43px wide, which puts the "NEXT HOME" lettering inside the house
              at ~5px. That is inherent to the artwork at header scale, not a
              defect introduced here, and the client has accepted it. Do not
              "fix" it by scaling further; it would grow the bar without ever
              making the words readable.

              WHY THE PHONE STEPS DOWN to h-12 (48px, ~37px wide). Not taste:
              at 375px this bar carries menu + back + logo + Log in + Register,
              which measures 331px of the 375. h-14 there would cut that slack
              to ~36px, inside the range where a longer label tips it into
              overflow. Measured, not estimated. */}
          <Link
            href="/"
            aria-label="NextHome — go to homepage"
            aria-current={isHome ? "page" : undefined}
            // min-h-11 (44px) is the touch-target floor. The logo is the ONLY
            // implicit route home, so it has to be comfortably tappable, not
            // just clickable. At h-11 the artwork is 44px tall and meets that
            // floor on its own; -mx-2/px-2 widens the narrow (~34px) mark to
            // the floor horizontally too, without moving it optically.
            className="-mx-2 flex min-h-11 shrink-0 items-center rounded-[var(--radius-control)] px-2"
          >
            <Image
              src="/brand/nexthome-logo-primary.png"
              alt="NextHome"
              width={2267}
              height={2958}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          <nav
            aria-label="Primary"
            // Resting weight is Bold, not Medium (client request, 9 Sep). Both
            // are brand weights — Quicksand 500/700 are the only two loaded, so
            // "bolder" has exactly one available meaning and this is it.
            className="u-ui hidden items-center gap-8 text-[13px] font-bold text-[var(--color-text-secondary)] md:ml-5 md:flex lg:ml-8"
          >
            {PRIMARY_LINKS.map((link) => {
              const isActive = isListingsSection(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative py-2 transition-colors duration-[var(--motion-duration-short)] hover:text-[var(--color-text-primary)] ${
                    isActive ? "text-[var(--color-text-primary)]" : ""
                  }`}
                >
                  {link.label}
                  {/* ACTIVE STATE, re-derived after the weight change above.
                      It used to be carried by weight (Medium -> Bold) plus this
                      rule. Now that the resting weight IS Bold, weight can no
                      longer differentiate anything, so `font-bold` has been
                      dropped from the active branch rather than left in place
                      pretending to do work.

                      What carries it instead: Deep Blue -> Dark Blue on the
                      label, and this rule. The rule is the load-bearing one —
                      it is the cue that survives greyscale and colour-blindness,
                      which a hue shift between two dark blues does not. It uses
                      brand Blue as a fill, not as text, and clears the 3:1
                      non-text contrast minimum. `aria-current="page"` above
                      states it outright for assistive tech either way. */}
                  {isActive && (
                    <motion.span
                      aria-hidden
                      layoutId="nav-active-rule"
                      className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[var(--color-brand-primary)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Persistent role switcher — spec §3B. Renders nothing unless the
              user actually holds more than one role. */}
          {isAuthenticated && <RoleSwitcher />}

          {canListProperty && (
            <Link
              href="/dashboard/listings/new"
              className="u-ui hidden rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-4 py-2 text-[13px] font-bold text-white shadow-[var(--elevation-xs)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)] sm:inline-block"
            >
              List Your Property
            </Link>
          )}

          {/* Admin has no /dashboard — dashboard/layout.tsx renders nothing
              without an activeRole, which admin never has. The account
              dropdown's "Admin overview" link (ADMIN_ACCOUNT_LINKS above) is
              its equivalent quick link. */}
          {isAuthenticated && !user?.isAdmin && (
            <Link
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={`u-ui hidden rounded-[var(--radius-control)] px-3 py-2 text-[13px] font-bold transition-colors duration-[var(--motion-duration-short)] md:inline-block ${
                isActivePath(pathname, "/dashboard")
                  ? "bg-[var(--color-surface-dense)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Dashboard
            </Link>
          )}

          {/* Same reason: admin has no role-scoped notification feed
              (notification-context.tsx returns [] without an activeRole), so
              unreadCount is always 0 and the link's destination is blank. */}
          {isAuthenticated && !user?.isAdmin && (
            <Link
              href="/dashboard/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-text-primary)]"
            >
              <IconBell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="u-numeric absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[10px] font-bold text-white"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {!isAuthenticated ? (
            <>
              {/* Two of the spec's three nav items. A plain text link and one
                  solid brand button — a deliberate two-tier hierarchy, not two
                  controls of equal weight, so "Register" is unambiguously the
                  primary path now that registration unlocks the product. */}
              <Link
                href="/login"
                // Log in and Register are two thirds of the entire navigation
                // now, and on a phone they are most of what the header offers
                // at all. Both were measuring 32-36px tall, under the 44px
                // touch floor, which matters far more for them than it did
                // when they sat among six other items.
                className="u-ui flex min-h-11 items-center rounded-[var(--radius-control)] px-2.5 text-[13px] font-bold text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:text-[var(--color-text-primary)]"
              >
                Log in
              </Link>
              <Link href="/register" className="flex items-center">
                <Button size="dense" className="min-h-11 px-4">
                  Register
                </Button>
              </Link>
            </>
          ) : (
            <div className="relative" ref={accountMenuRef}>
              <Button
                variant="secondary"
                size="dense"
                onClick={() => setAccountMenuOpen((v) => !v)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
              >
                <Avatar name={user?.name ?? "Account"} size={22} className="ring-0" />
                <span className="sr-only">Account menu</span>
                <IconChevronDown
                  aria-hidden
                  className={`h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] ${
                    accountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
              {/* NO EXIT ANIMATION on the panel below, for the reason
                  Overlay.tsx sets out at length: every item in this menu closes
                  it AND navigates, and a route change interrupts the exit
                  animation before it completes — leaving the panel mounted,
                  visible, and covering the page it just navigated to. Worse,
                  the detached node is out of React's tree, so its "Viewing as"
                  line freezes on whatever role was active before the navigation
                  and contradicts the header switcher beside it. Observed in
                  testing, not theorised. Enter is still animated; that is where
                  the meaning is. */}
              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-2 shadow-[var(--elevation-lg)]"
                  >
                    {/* Additive, not a replacement for the "Viewing as" line
                        below — that line answers "which role am I acting as
                        right now" (a state the role switcher also controls);
                        this one answers "which account am I signed into",
                        which has no other control anywhere in this menu and
                        previously never appeared at all (the trigger button's
                        avatar circle used a hardcoded "Account" name, never
                        the real one). */}
                    {user?.name && (
                      <p className="px-2 pb-1 pt-1 text-xs text-[var(--color-text-secondary)]">
                        Signed in as{" "}
                        <span className="font-bold text-[var(--color-text-primary)]">{user.name}</span>
                      </p>
                    )}

                    {/* The "Active role" list that used to sit here is gone —
                        the persistent switcher in the bar is now the single
                        control for that (see RoleSwitcher.tsx). What remains
                        here is a read-only statement of who you currently are,
                        so the menu still answers it without offering a second,
                        competing way to change it. */}
                    {/* Admin has no active role at all (it is orthogonal to the
                        role system — see AuthUser.isAdmin), so this reads
                        "Admin" instead of a role name rather than disappearing:
                        it is a passive statement of who is signed in, not a
                        control, so there is nothing to hide it for. */}
                    {(user?.isAdmin || activeRole) && (
                      <p className="border-b border-[var(--color-border-hairline)] px-2 pb-2 pt-1 text-xs text-[var(--color-text-secondary)]">
                        Viewing as{" "}
                        <span className="font-bold text-[var(--color-text-primary)]">
                          {user?.isAdmin
                            ? "Admin"
                            : roleDisplay(activeRole!, roles.find((r) => r.role === activeRole)?.context)}
                        </span>
                      </p>
                    )}

                    <div className="pt-1.5">
                      {accountLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          className="flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-dense)]"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          {item.label}
                          {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                            <span className="u-numeric inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[11px] font-bold text-white">
                              {unreadCount}
                              <span className="sr-only"> unread</span>
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>

                    <div className="my-1.5 border-t border-[var(--color-border-hairline)]" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        logout();
                        setAccountMenuOpen(false);
                      }}
                      className="block min-h-11 w-full rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm font-bold text-[var(--color-status-rejected)] hover:bg-[var(--color-surface-dense)]"
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Primary"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            // Same reason as the account menu above — its links navigate, and
            // an interrupted exit leaves the whole drawer stuck open over the
            // destination page, with a stale role switcher inside it.
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[var(--color-border-hairline)] md:hidden"
          >
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-4 pb-4 pt-2">
              {PRIMARY_LINKS.map((link) => {
                const isActive = isListingsSection(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between rounded-[var(--radius-control)] px-2 text-sm font-bold ${
                      isActive
                        ? "bg-[var(--color-surface-dense)] text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]" />
                    )}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-[var(--color-border-hairline)]" />

              {isAuthenticated ? (
                <>
                  {canListProperty && (
                    <Link
                      href="/dashboard/listings/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center rounded-[var(--radius-control)] px-2 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-dense)]"
                    >
                      List Your Property
                    </Link>
                  )}

                  {accountLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-dense)]"
                    >
                      {item.label}
                      {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                        <span className="u-numeric inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[11px] font-bold text-white">
                          {unreadCount}
                          <span className="sr-only"> unread</span>
                        </span>
                      )}
                    </Link>
                  ))}

                  {/* Role switching matters more on a phone, not less — it is
                      what decides what the dashboard and the notification feed
                      even contain. Same component, flat-list variant. */}
                  <RoleSwitcher variant="drawer" />

                  <div className="my-2 border-t border-[var(--color-border-hairline)]" />
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center rounded-[var(--radius-control)] px-2 text-left text-sm font-bold text-[var(--color-status-rejected)] hover:bg-[var(--color-surface-dense)]"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="mt-2 flex flex-col gap-2 px-2">
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Register</Button>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-default)] text-sm font-bold text-[var(--color-text-primary)] hover:border-[var(--color-deep-blue)]"
                  >
                    Log in
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
