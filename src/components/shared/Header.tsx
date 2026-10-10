"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CONTAINER_CLASS } from "@/components/ui/Container";
import { IconArrowLeft, IconBell, IconChevronDown, IconClose, IconMenu } from "@/components/ui/icons";
import { FOCUS_RING } from "@/components/ui/SelectField";
import { NavMenu, useMenuState } from "@/components/shared/NavMenu";
import {
  AccountHeader,
  AccountItems,
  ListingsMenuContent,
  MobileSheetContent,
  MoreMenuContent,
  ReviewNote,
} from "@/components/shared/nav-content";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";

// ===========================================================================
// NAV (Website Revision Spec §3A, 24 Aug 2026)
// ===========================================================================
// The client's rule: the top-level nav is Listings, Log in, Register. Rent,
// Buy, Services and Help are NOT top-level items, and nothing here adds them.
//
// What changed in the redesign is what sits UNDER those items, not the list:
//
//   Listings ▾   a menu, not a link — Rent / Buy, a link to the landing page's
//                location cards, short- and long-term rentals (existing URLs).
//   Menu         secondary links (How it works, Verified listings, FAQs).
//   Account ▾    when signed in: Dashboard, Switch role, Profile, Log out.
//
// Where the old top-level items went (unchanged from the spec):
//   Home          → the logo is the home link.
//   Rent / Buy    → the Listings menu, and the toggle on /listings (§3C).
//   Services/Help → the footer. "FAQs" in the Menu links to the one existing
//                   FAQ page; it is not a "Help" item.
//   List Your     → role-gated (§3A): shown only to a signed-in user whose
//   Property        ACTIVE role is Landlord. See the comment at its site.
// ===========================================================================

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

// A label with the Blue "you are here" bar under it. The bar is the Blue; the
// text stays Dark Blue (Blue text at 14px is 3.6:1 on white, under AA).
function NavLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className="relative">
      {children}
      {active && (
        <span aria-hidden className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[var(--color-brand-primary)]" />
      )}
    </span>
  );
}

const navItem =
  "inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] aria-expanded:bg-[var(--color-surface-base)]";

export function Header() {
  const { user, isAuthenticated, activeRole } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const sheet = useMenuState();
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // A soft shadow and hairline appear once the page has scrolled under the bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // The mobile sheet closes on Escape or a press outside the header.
  const sheetHide = sheet.hide;
  useEffect(() => {
    if (!sheet.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && sheetHide();
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) sheetHide();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [sheet.open, sheetHide]);

  // §3A: "List Your Property ... only appears once a user is registered with,
  // and currently acting as, the Landlord role — it is a role-gated nav item,
  // not a public one."
  //
  // Both halves are required: holding the role is not enough, the role has to
  // be the ACTIVE one. That is what makes the persistent switcher meaningful —
  // switching to Landlord is what puts this control in the bar.
  const canListProperty = isAuthenticated && activeRole === "landlord";

  // BACK-TO-HOME ARROW. The logo has been the only route home since the nav
  // reduction, and an unlabelled logo is an *implicit* affordance. This adds
  // the explicit one, on every route except the homepage itself. It is a Link
  // to "/", not router.back(): browser history is frequently not this site's
  // homepage at all. Deliberately icon-only — a labelled "Home" control would
  // re-introduce the exact top-level item spec §3A removed.
  const isHome = pathname === "/";

  const listingsActive = isListingsSection(pathname);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b bg-[color-mix(in_srgb,var(--color-white)_90%,transparent)] backdrop-blur-md transition-[box-shadow,border-color] duration-200 [--bleed-bg:color-mix(in_srgb,var(--color-white)_90%,transparent)] ${
        isHome ? "u-bleed-white" : ""
      } ${
        scrolled
          ? "border-[var(--color-border-hairline)] shadow-[0_10px_30px_-16px_rgba(23,42,58,0.25)]"
          : "border-transparent"
      }`}
    >
      {/* Home uses the shared 1280px landing container, so the logo lines up
          with the hero text; other routes keep their own 6xl until they are
          migrated, so the logo stays aligned with each page's content. */}
      <div
        className={`flex h-16 items-center justify-between gap-3 sm:gap-6 md:h-20 ${
          isHome ? CONTAINER_CLASS : "mx-auto max-w-6xl px-4 sm:px-6"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className={`-ml-2 flex min-h-12 min-w-12 items-center justify-center rounded-xl! text-[var(--color-deep-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] md:hidden ${FOCUS_RING}`}
            onClick={() => (sheet.open ? sheet.hide() : sheet.show())}
            aria-expanded={sheet.open}
            aria-controls="mobile-nav"
            aria-label={sheet.open ? "Close menu" : "Open menu"}
          >
            {sheet.open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>

          {!isHome && (
            <Link
              href="/"
              aria-label="Back to homepage"
              title="Back to homepage"
              // Bordered rather than bare: it sits directly beside the logo,
              // which is also a link to "/", so it has to read as a control in
              // its own right instead of as part of the mark.
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-brand-primary)] md:h-11 md:w-11"
            >
              <IconArrowLeft className="h-[18px] w-[18px]" />
            </Link>
          )}

          {/* THE HOME LINK (spec §3A: the logo is the click target that returns
              the user to the homepage). Official NextHome Primary Logo, extracted
              from the approved Brand Guidelines PDF (p.3); the artwork is
              untouched, only its display height is set.

              The wordmark inside this portrait mark is not legible at header
              scale and cannot be (see REVISION_LOG.md §16a) — do not "fix" it
              by scaling further. min-h-11 is the touch-target floor; -mx-2/px-2
              widens the narrow mark to it without moving it optically. */}
          <Link
            href="/"
            aria-label="NextHome — go to homepage"
            aria-current={isHome ? "page" : undefined}
            className="-mx-2 flex min-h-11 shrink-0 items-center rounded-xl px-2"
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

          <nav aria-label="Primary" className="hidden md:ml-4 md:flex lg:ml-6">
            <NavMenu
              openOnHover
              triggerClassName={`${navItem} rounded-xl`}
              trigger={({ open }) => (
                <>
                  <NavLabel active={listingsActive}>Listings</NavLabel>
                  <IconChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-[var(--color-deep-blue)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </>
              )}
              panelClassName="md:w-[32rem] lg:w-[44rem]"
              footer={
                <div className="rounded-b-2xl bg-[var(--color-surface-base)] px-5 py-3.5 md:px-6">
                  <ReviewNote />
                </div>
              }
            >
              <ListingsMenuContent />
            </NavMenu>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Secondary links. Icon only below `lg` — on a phone the same links
              live in the sheet behind the hamburger. */}
          <div className="hidden md:block">
            <NavMenu
              align="right"
              triggerAriaLabel="Menu"
              triggerClassName={`${navItem} rounded-xl`}
              trigger={({ open }) => (
                <>
                  <IconMenu aria-hidden className="h-5 w-5" />
                  <span className="hidden lg:inline">Menu</span>
                  <IconChevronDown
                    aria-hidden
                    className={`hidden h-4 w-4 text-[var(--color-deep-blue)] transition-transform duration-200 lg:block ${open ? "rotate-180" : ""}`}
                  />
                </>
              )}
              panelClassName="w-[19rem]"
            >
              <MoreMenuContent pathname={pathname} />
            </NavMenu>
          </div>

          {/* Persistent role switcher — spec §3B. Renders nothing unless the
              user actually holds more than one role. */}
          {isAuthenticated && <RoleSwitcher />}

          {canListProperty && (
            <Link
              href="/dashboard/listings/new"
              className="u-ui hidden min-h-11 items-center rounded-xl bg-[var(--color-dark-blue)] px-4 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)] sm:inline-flex"
            >
              List Your Property
            </Link>
          )}

          {/* Admin has no /dashboard — dashboard/layout.tsx renders nothing
              without an activeRole, which admin never has. The account menu's
              "Admin overview" is its equivalent. */}
          {isAuthenticated && !user?.isAdmin && (
            // Wrapped, not given `hidden md:inline-flex` directly: navItem carries its
            // own `inline-flex`, and with no tailwind-merge that beat `hidden` and
            // left this link on phones.
            <span className="hidden md:inline-flex">
              <Link
                href="/dashboard"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
                className={`rounded-xl! ${navItem} ${FOCUS_RING}`}
              >
                <NavLabel active={isActivePath(pathname, "/dashboard")}>Dashboard</NavLabel>
              </Link>
            </span>
          )}

          {/* Same reason: admin has no role-scoped notification feed
              (notification-context.tsx returns [] without an activeRole), so
              unreadCount is always 0 and the link's destination is blank. */}
          {isAuthenticated && !user?.isAdmin && (
            <Link
              href="/dashboard/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl! md:h-11 md:w-11 text-[var(--color-deep-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] ${FOCUS_RING}`}
            >
              <IconBell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="u-numeric absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[10px] font-bold text-white"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {!isAuthenticated ? (
            <>
              {/* Two of the spec's three nav items: a plain text link and one
                  outlined Dark Blue button, so "Register" stays the primary
                  path without a filled control competing with the hero CTA.
                  Both are 44px tall — on a phone they are most of the nav. */}
              <Link
                href="/login"
                className={`u-ui flex min-h-12 items-center rounded-xl! px-3 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] md:min-h-11 ${FOCUS_RING}`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`u-ui flex min-h-12 items-center rounded-xl! border border-[var(--color-dark-blue)] px-4 md:min-h-11 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-dark-blue)] hover:text-white ${FOCUS_RING}`}
              >
                Register
              </Link>
            </>
          ) : (
            <NavMenu
              align="right"
              triggerAriaLabel="Account menu"
              triggerClassName="inline-flex min-h-12 items-center gap-2 border border-[var(--color-dark-blue)] px-3 md:min-h-11 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] aria-expanded:bg-[var(--color-surface-base)]"
              trigger={({ open }) => (
                <>
                  <Avatar name={user?.name ?? "Account"} size={22} className="ring-0" />
                  <IconChevronDown
                    aria-hidden
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </>
              )}
              panelClassName="w-[18rem]"
              header={<AccountHeader />}
            >
              <div className="p-2">
                <AccountItems />
              </div>
            </NavMenu>
          )}
        </div>
      </div>

      {/* Mobile: one sheet with everything the desktop menus offer. */}
      {sheet.rendered && (
        <div
          id="mobile-nav"
          data-state={sheet.open ? "open" : "closed"}
          // Any link or action in the sheet closes it (links still navigate).
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a[href], button")) sheet.hide();
          }}
          className="u-menu-panel absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] origin-top overflow-y-auto overscroll-contain rounded-b-3xl border-t border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[0_24px_60px_-16px_rgba(23,42,58,0.32)] md:hidden"
        >
          <MobileSheetContent
            pathname={pathname}
            isAuthenticated={isAuthenticated}
            loggedOutActions={
              <div className="flex flex-col gap-2 px-0 pb-2">
                <Link
                  href="/register"
                  className={`flex min-h-12 items-center justify-center rounded-xl! border border-[var(--color-dark-blue)] text-[15px] font-bold text-[var(--color-dark-blue)] hover:bg-[var(--color-dark-blue)] hover:text-white ${FOCUS_RING}`}
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className={`flex min-h-12 items-center justify-center rounded-xl! text-[15px] font-bold text-[var(--color-dark-blue)] hover:bg-[var(--color-surface-base)] ${FOCUS_RING}`}
                >
                  Log in
                </Link>
              </div>
            }
          />
        </div>
      )}
    </header>
  );
}
