"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CONTAINER_CLASS, PAGE_CONTAINER_CLASS } from "@/components/ui/Container";
import { IconChevronDown, IconClose, IconMenu } from "@/components/ui/icons";
import { FOCUS_RING } from "@/components/ui/SelectField";
import { MenuLink, NavMenu, useMenuState } from "@/components/shared/NavMenu";
import {
  AccountHeader,
  AccountItems,
  MobileAccountPanel,
  MenuPanelHeader,
  MobileSheetContent,
  MoreMenuContent,
  ReviewNote,
} from "@/components/shared/nav-content";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";

// ===========================================================================
// HEADER
// ===========================================================================
// One simple bar on phones and laptops, a pill on tablets:
//
//   PHONES  (below md)   [ Login | account ]   logo, centred   [ menu ]
//   TABLETS (md to lg)   logo left                [ Login | account | menu ]
//   LAPTOPS (lg and up)  [ Login | account ]   logo, centred   [ Menu ]
//
// The left control is Login when signed out and the account control when signed
// in (phones: a full-width panel; laptops: a dropdown with the same content).
// The right control is the Menu (phones: a panel; laptops: a dropdown with the
// same groups). Everything else that used to sit in the laptop bar lives inside
// those two: Listings, Register, the role switcher, Dashboard, Notifications and
// List Your Property. See nav-content.tsx for what is where.
// ===========================================================================

// The two laptop pills (Login / account on the left, Menu on the right) share
// one look, and match the phone buttons: bordered, rounded, 44px.
const PILL =
  "inline-flex h-11 items-center gap-2 border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 text-sm font-bold text-[var(--color-dark-blue)] shadow-[var(--elevation-xs)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] aria-expanded:bg-[var(--color-surface-base)]";

export function Header() {
  const { user, isAuthenticated, activeRole } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
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

  const isHome = pathname === "/";

  // Phones and tablets use the compact controls below (the profile button opens
  // the account panel, the menu button opens site navigation); from `lg` the
  // same two controls are dropdowns (see the left and right slots).
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
                <Link
          href="/"
          aria-label="NextHome — go to homepage"
          aria-current={isHome ? "page" : undefined}
          className="flex min-h-11 shrink-0 items-center rounded-xl px-2"
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

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Login/account controls now sit here, on the right, next to Menu.
              Phones: Login, or the profile button. Laptops: Login, or the account dropdown. */}
          {isAuthenticated ? (
            <>
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
            <div className="hidden lg:block">
              <NavMenu
                align="right"
                triggerAriaLabel={unreadCount > 0 ? `Account menu, ${unreadCount} unread notifications` : "Account menu"}
                triggerClassName={`relative h-11 w-11 justify-center ${PILL.replace("px-4", "px-0")}`}
                triggerShape="rounded-full!"
                trigger={({ open }) => (
                  <>
                    <Avatar name={user?.name ?? "Account"} size={30} className="ring-0" />
                    {unreadCount > 0 && !open && (
                      <span
                        aria-hidden
                        className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-brand-primary)] ring-2 ring-[var(--color-surface-raised)]"
                      />
                    )}
                  </>
                )}
                panelClassName="w-[18rem]"
                header={<AccountHeader />}
              >
                <div className="p-2">
                  {canListProperty && <MenuLink href="/dashboard/listings/new" label="List Your Property" />}
                  <AccountItems />
                </div>
              </NavMenu>
            </div>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => sheet.hide()}
              className={`flex h-11 shrink-0 items-center rounded-full! border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 text-sm font-bold text-[var(--color-dark-blue)] shadow-[var(--elevation-xs)] transition-colors duration-200 hover:bg-[var(--color-surface-base)] md:hidden lg:flex ${FOCUS_RING}`}
            >
              Login
            </Link>
          )}

          {/* RIGHT slot, laptops: the Menu dropdown, with the same groups as the
              phone menu (and the same "every listing is reviewed" note under
              them). */}
          <div className="hidden lg:block">
            <NavMenu
              align="right"
              triggerAriaLabel="Menu"
              triggerClassName={PILL}
              triggerShape="rounded-full!"
              trigger={({ open }) => (
                <>
                  <IconMenu aria-hidden className="h-5 w-5" />
                  <span>Menu</span>
                  <IconChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-[var(--color-deep-blue)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </>
              )}
              panelClassName="w-[19rem]"
              header={({ close }) => <MenuPanelHeader onClose={close} className="px-5 py-3" />}
              footer={
                <div className="rounded-b-2xl bg-[var(--color-surface-base)] px-5 py-3.5">
                  <ReviewNote />
                </div>
              }
            >
              <MoreMenuContent pathname={pathname} />
            </NavMenu>
          </div>

          {/* Phones and tablets (below lg): ONE pill, last on the bar, top-right. Signed out:
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
