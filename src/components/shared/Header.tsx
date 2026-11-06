"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CONTAINER_CLASS, PAGE_CONTAINER_CLASS } from "@/components/ui/Container";
import { IconArrowLeft, IconBell, IconChevronDown, IconClose, IconMenu } from "@/components/ui/icons";
import { FOCUS_RING } from "@/components/ui/SelectField";
import { NavMenu, useMenuState } from "@/components/shared/NavMenu";
import {
  AccountHeader,
  AccountItems,
  ListingsMenuContent,
  MobileAccountPanel,
  MenuPanelHeader,
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

// Where the back arrow goes when there is no earlier page on this site to
// return to (a shared link opened directly, a new tab).
const BACK_FALLBACK = "/listings";

// Subset of the Navigation API (Chromium, Safari) that the back arrow needs.
type NavigationLike = {
  canGoBack: boolean;
  currentEntry: { index: number } | null;
  entries(): { url: string | null }[];
};

/**
 * Whether the entry before this one is a page of THIS site: true/false when
 * the Navigation API can tell, null when the browser doesn't have it.
 *
 * The API only exposes same-origin entries, so an external page the visitor
 * came from (a chat app, a search result) is simply not "previous" — which is
 * exactly what stops the arrow from ever leaving the site.
 */
function previousEntryIsOnSite(): boolean | null {
  const nav = (window as unknown as { navigation?: NavigationLike }).navigation;
  if (!nav || typeof nav.canGoBack !== "boolean") return null;
  if (!nav.canGoBack || !nav.currentEntry) return false;
  const prev = nav.entries()[nav.currentEntry.index - 1];
  if (!prev?.url) return false;
  try {
    return new URL(prev.url).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function Header() {
  const { user, isAuthenticated, activeRole } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const sheet = useMenuState();
  const account = useMenuState();
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

  // The two compact panels (site navigation, account) close on Escape or a
  // press outside the header. Only one is open at a time (see the buttons).
  const sheetHide = sheet.hide;
  const accountHide = account.hide;
  const anyPanelOpen = sheet.open || account.open;
  useEffect(() => {
    if (!anyPanelOpen) return;
    const closeAll = () => {
      sheetHide();
      accountHide();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) closeAll();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [anyPanelOpen, sheetHide, accountHide]);

  // §3A: "List Your Property ... only appears once a user is registered with,
  // and currently acting as, the Landlord role — it is a role-gated nav item,
  // not a public one."
  //
  // Both halves are required: holding the role is not enough, the role has to
  // be the ACTIVE one. That is what makes the persistent switcher meaningful —
  // switching to Landlord is what puts this control in the bar.
  const canListProperty = isAuthenticated && activeRole === "landlord";

  // BACK ARROW, on every route except the homepage. It returns to the page the
  // visitor came from (browser history), and only when that page is on this
  // site; otherwise it follows its own href to the Listings page. The logo
  // remains the way home. Deliberately icon-only — a labelled control would
  // re-introduce a top-level item spec §3A removed.
  const isHome = pathname === "/";

  // Fallback for browsers without the Navigation API (Firefox, older Safari):
  // count this tab's in-app page changes. An earlier on-site page exists only
  // if one happened, and after a browser back/forward (popstate) the position
  // in history is no longer known, so it is not trusted until the next load.
  const inAppNavs = useRef(0);
  const lastPath = useRef<string | null>(null);
  const sawPopState = useRef(false);
  useEffect(() => {
    if (lastPath.current !== null && lastPath.current !== pathname) inAppNavs.current += 1;
    lastPath.current = pathname;
  }, [pathname]);
  useEffect(() => {
    const onPop = () => {
      sawPopState.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const onBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let "open in new tab" gestures follow the href as normal.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const onSite =
      previousEntryIsOnSite() ?? (inAppNavs.current > 0 && !sawPopState.current && window.history.length > 1);
    if (onSite) {
      e.preventDefault();
      router.back();
    }
  };

  const listingsActive = isListingsSection(pathname);

  // Below 1024px the header is compact. PHONES (below `md`): the logo is
  // centred, Login (signed out) or the profile button (signed in) is on the
  // left and the menu button is on the right. TABLETS (`md` to `lg`): the logo
  // stays left and one pill on the right holds "Login | menu" or "profile |
  // menu". The profile button opens the account panel, the menu button opens
  // site navigation. The full header starts at `lg`.
  const toggleAccount = () => {
    if (account.open) account.hide();
    else {
      sheet.hide();
      account.show();
    }
  };
  const accountLabel = account.open
    ? "Close account menu"
    : unreadCount > 0
      ? `Account menu, ${unreadCount} unread notifications`
      : "Account menu";

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
          with the hero text; other routes use the fluid page container (1152px
          on laptops), so the logo stays aligned with each page's content. */}
      <div
        className={`relative flex h-16 items-center justify-between gap-3 sm:gap-6 md:h-20 ${
          isHome ? CONTAINER_CLASS : PAGE_CONTAINER_CLASS
        }`}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {!isHome && (
            <Link
              href={BACK_FALLBACK}
              onClick={onBackClick}
              aria-label="Back to previous page"
              title="Back"
              // Hidden on phones (the logo sits alone, top-left; the browser has its own
              // back control). Bordered rather than bare: it sits directly beside the logo,
              // which is also a link to "/", so it has to read as a control in
              // its own right instead of as part of the mark.
              className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] lg:flex text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-brand-primary)]`}
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
          {/* Phones only: Login, or the profile button, on the LEFT. */}
          {isAuthenticated ? (
            <button
              type="button"
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full! border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-xs)] md:hidden ${FOCUS_RING}`}
              onClick={toggleAccount}
              aria-expanded={account.open}
              aria-controls="mobile-account"
              aria-label={accountLabel}
            >
              {account.open ? (
                <IconClose className="h-5 w-5 text-[var(--color-deep-blue)]" />
              ) : (
                <Avatar name={user?.name ?? "Account"} size={30} className="ring-0" />
              )}
              {unreadCount > 0 && !account.open && (
                <span
                  aria-hidden
                  className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-brand-primary)] ring-2 ring-[var(--color-surface-raised)]"
                />
              )}
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => sheet.hide()}
              className={`flex h-11 shrink-0 items-center rounded-full! border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 text-sm font-bold text-[var(--color-dark-blue)] shadow-[var(--elevation-xs)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] md:hidden ${FOCUS_RING}`}
            >
              Login
            </Link>
          )}

          {/* On phones the logo is taken out of the flow and centred on the
              bar (the Login/profile button and the menu button balance it on
              either side); from `md` it is an ordinary left-aligned item. */}
          <Link
            href="/"
            aria-label="NextHome — go to homepage"
            aria-current={isHome ? "page" : undefined}
            className="absolute left-1/2 -translate-x-1/2 flex min-h-11 shrink-0 items-center rounded-xl px-2 md:static md:-mx-2 md:translate-x-0"
          >
            <Image
              src="/brand/nexthome-logo-primary.png"
              alt="NextHome"
              width={2267}
              height={2958}
              priority
              className="h-14 w-auto"
            />
          </Link>

          <nav aria-label="Primary" className="hidden lg:ml-6 lg:flex">
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
          <div className="hidden lg:block">
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
              header={({ close }) => <MenuPanelHeader onClose={close} className="px-5 py-3" />}
            >
              <MoreMenuContent pathname={pathname} />
            </NavMenu>
          </div>

          {/* Persistent role switcher — spec §3B. Renders nothing unless the
              user actually holds more than one role. */}
          {isAuthenticated && (
            <div className="hidden lg:contents">
              <RoleSwitcher />
            </div>
          )}

          {canListProperty && (
            <Link
              href="/dashboard/listings/new"
              className="u-ui hidden min-h-11 items-center rounded-xl bg-[var(--color-dark-blue)] px-4 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)] lg:inline-flex"
            >
              List Your Property
            </Link>
          )}

          {/* Admin has no /dashboard — dashboard/layout.tsx renders nothing
              without an activeRole, which admin never has. The account menu's
              "Admin overview" is its equivalent. */}
          {isAuthenticated && !user?.isAdmin && (
            // Wrapped, not given `hidden lg:inline-flex` directly: navItem carries its
            // own `inline-flex`, and with no tailwind-merge that beat `hidden` and
            // left this link on phones.
            <span className="hidden lg:inline-flex">
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
              className={`relative hidden h-12 w-12 items-center justify-center rounded-xl! lg:flex lg:h-11 lg:w-11 text-[var(--color-deep-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] ${FOCUS_RING}`}
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
              {/* Phones: neither shows here — Log in and Register are in the
                  hamburger menu, so the bar is just the logo and the menu
                  button. `hidden lg:flex`, a full class swap rather than an
                  added `hidden`: there is no tailwind-merge. */}
              <Link
                href="/login"
                className={`u-ui hidden min-h-11 items-center rounded-xl! px-3 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] lg:flex ${FOCUS_RING}`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`u-ui hidden lg:flex min-h-11 items-center rounded-xl! border border-[var(--color-dark-blue)] px-3 lg:px-4 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-dark-blue)] hover:text-white ${FOCUS_RING}`}
              >
                Register
              </Link>
            </>
          ) : (
            <div className="hidden lg:contents">
              <NavMenu
                align="right"
                triggerAriaLabel="Account menu"
                triggerClassName="inline-flex min-h-12 items-center gap-2 border border-[var(--color-dark-blue)] px-3 lg:min-h-11 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] aria-expanded:bg-[var(--color-surface-base)]"
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
            </div>
          )}

          {/* Phones and tablets: ONE pill, last on the bar, top-right. Signed out:
              "Login", a hairline divider, then the menu button — Login goes
              straight to the login page (Register is reached from there).
              Signed in: the profile button (your initials; a dot when there are
              unread notifications), the divider, then the menu button. The
              profile button opens the account panel; the menu button opens
              site navigation. Opening one closes the other. */}
          <div className="flex h-11 items-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-xs)] md:h-12 lg:hidden">
            {isAuthenticated ? (
              <button
                type="button"
                className={`relative hidden h-full w-12 items-center justify-center rounded-l-full! transition-colors duration-200 hover:bg-[var(--color-surface-base)] md:flex md:w-14 ${FOCUS_RING}`}
                onClick={toggleAccount}
                aria-expanded={account.open}
                aria-controls="mobile-account"
                aria-label={accountLabel}
              >
                {account.open ? (
                  <IconClose className="h-5 w-5 text-[var(--color-deep-blue)] md:h-6 md:w-6" />
                ) : (
                  <Avatar name={user?.name ?? "Account"} size={30} className="ring-0" />
                )}
                {unreadCount > 0 && !account.open && (
                  <span
                    aria-hidden
                    className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--color-brand-primary)] ring-2 ring-[var(--color-surface-raised)] md:right-2.5"
                  />
                )}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => sheet.hide()}
                className={`hidden h-full items-center rounded-l-full! pl-4 pr-3 text-sm font-bold md:flex md:pl-5 md:pr-4 md:text-[15px] text-[var(--color-dark-blue)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] ${FOCUS_RING}`}
              >
                Login
              </Link>
            )}
            <span aria-hidden className="hidden h-5 w-px bg-[var(--color-border-default)] md:block md:h-6" />
            <button
              type="button"
              className={`flex h-full w-11 items-center justify-center rounded-full! text-[var(--color-deep-blue)] md:w-14 md:rounded-l-none! md:rounded-r-full! transition-colors duration-200 hover:bg-[var(--color-surface-base)] ${FOCUS_RING}`}
              onClick={() => {
                if (sheet.open) sheet.hide();
                else {
                  account.hide();
                  sheet.show();
                }
              }}
              aria-expanded={sheet.open}
              aria-controls="mobile-nav"
              aria-label={sheet.open ? "Close menu" : "Open menu"}
            >
              {sheet.open ? <IconClose className="h-5 w-5 md:h-6 md:w-6" /> : <IconMenu className="h-5 w-5 md:h-6 md:w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Compact header: site navigation (the menu button's panel). */}
      {sheet.rendered && (
        <div
          id="mobile-nav"
          data-state={sheet.open ? "open" : "closed"}
          // Any link or action in the panel closes it (links still navigate).
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a[href], button")) sheet.hide();
          }}
          className="u-menu-panel absolute inset-x-0 top-0 max-h-[100dvh] origin-top overflow-y-auto overscroll-contain rounded-b-3xl bg-[var(--color-surface-raised)] shadow-[0_24px_60px_-16px_rgba(23,42,58,0.32)] lg:hidden"
        >
          <MobileSheetContent pathname={pathname} onClose={() => sheet.hide()} />
        </div>
      )}

      {/* Compact header, signed in: the account panel (the profile button's). */}
      {isAuthenticated && account.rendered && (
        <div
          id="mobile-account"
          data-state={account.open ? "open" : "closed"}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a[href], button")) account.hide();
          }}
          className="u-menu-panel absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] origin-top overflow-y-auto overscroll-contain rounded-b-3xl border-t border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[0_24px_60px_-16px_rgba(23,42,58,0.32)] lg:hidden"
        >
          <MobileAccountPanel canListProperty={canListProperty} />
        </div>
      )}
    </header>
  );
}
