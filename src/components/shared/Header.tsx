"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconBell, IconChevronDown, IconClose, IconMenu } from "@/components/ui/icons";
import { ProtectedLink } from "@/components/shared/AuthGate";
import { useAuth, HeldRole } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { RoleName } from "@/lib/types";

const roleLabels: Record<RoleName, string> = {
  landlord: "Landlord",
  "tenant-buyer": "Tenant / Buyer",
  "service-provider": "Service Provider",
  advertiser: "Advertiser",
};

// Appends the Renting/Buying context for Tenant/Buyer only — context is not
// a role (ROLE_EXPERIENCE_AUDIT.md §4 Option C), so it's shown as a suffix,
// not a separate entry.
function roleDisplay(role: RoleName, context?: HeldRole["context"]) {
  if (role === "tenant-buyer" && context) {
    return `${roleLabels[role]} · ${context === "rent" ? "Renting" : "Buying"}`;
  }
  return roleLabels[role];
}

// Each primary destination is its own route — Rent and Buy are no longer
// two query-string variants of a shared /search page.
//
// NAV CLARITY PASS: "Home" is now an explicit, labelled destination rather
// than relying on the logo alone. A logo that links home is a convention
// experienced users know, but it is not a signposted affordance, and the
// brief was that users should immediately understand where they can go.
const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rent", label: "Rent" },
  { href: "/buy", label: "Buy" },
  { href: "/services", label: "Services" },
  { href: "/help", label: "Help" },
];

/**
 * Section-aware active state.
 *
 * Exact matching alone left a user on /services/s1 with nothing highlighted,
 * so the nav stopped answering "where am I?" precisely when the user was
 * deepest in the site. Home stays exact — every path starts with "/", so a
 * prefix test would light it up permanently.
 */
function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Authenticated destinations, shared by the desktop account menu and the
// mobile drawer so the two can never drift out of sync. Ordered by how often
// each is wanted; Log out is deliberately NOT in this list — it is an action,
// not a destination, and is rendered separately below its own divider.
const ACCOUNT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/account", label: "Account & roles" },
];

/** Detail routes belong to a section without sharing its path prefix. */
const SECTION_ALIASES: Record<string, string> = {
  "/listing": "/rent",
  "/services": "/services",
};

function isActiveSection(pathname: string, href: string) {
  if (isActivePath(pathname, href)) return true;
  const alias = Object.entries(SECTION_ALIASES).find(([prefix]) => pathname.startsWith(`${prefix}/`));
  // A listing detail page can be a rental or a sale, and the header cannot
  // know which without loading the listing — so it deliberately does not
  // guess, and only /services/* claims its parent section.
  return alias ? alias[0] === "/services" && alias[1] === href : false;
}

// AUDIT FIX (Phase 3 responsive): primary nav links were `hidden md:flex`
// with no mobile equivalent at all — on Compact viewports there was no way
// to reach Services/Help from the header. RESPONSIVE_STRATEGY.md requires
// the header to collapse to "logo + menu control," not just drop links.
//
// NAV REDESIGN — minimal/editorial/luxury-real-estate pass, header only:
// slimmer bar (less vertical padding, smaller logo display height —
// display size only, same asset/aspect ratio), nav links grouped with the
// logo on the left (left-of-center) instead of centered across the whole
// bar, lighter link weight, no shadow (hairline border only), and a
// genuine 3-tier right-side hierarchy — plain text link (Log in) →
// minimal outlined button (Post Property) → solid brand-color button
// (Register). Same links, same routes, same auth logic throughout.
export function Header() {
  const { isAuthenticated, roles, activeRole, setActiveRole, logout, login } = useAuth();
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

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
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
          {/* Official NextHome logo (Primary Logo variant — Brand
              Guidelines p.3: "the main visual representation of the Next
              Home brand and should be used wherever possible"). Extracted
              directly, pixel-for-pixel, from the approved Brand Guidelines
              PDF — not recreated. Fixed height + intrinsic width/height
              keeps the original aspect ratio locked — only the display
              height is set, now reduced for a slimmer bar; no card or
              rounded container around it. Untouched otherwise — brand
              identity is locked. */}
          <Link href="/" aria-label="NextHome home" className="flex shrink-0 items-center">
            <Image
              src="/brand/nexthome-logo-primary.png"
              alt="NextHome"
              width={2267}
              height={2958}
              priority
              className="h-9 w-auto"
            />
          </Link>

          {/* Nav links grouped with the logo (left-of-center), not
              centered across the whole bar — closer to the reference's
              minimal editorial layout than a symmetric 3-group split. */}
          <nav className="u-ui hidden items-center gap-8 text-[13px] font-medium text-[var(--color-text-secondary)] md:flex">
            {PRIMARY_LINKS.map((link) => {
              const isActive = isActiveSection(pathname, link.href);
              return (
                // `aria-current` is what actually communicates "you are
                // here" to assistive tech — the colour shift and underline
                // below are visual-only (the rule is aria-hidden), so
                // without this a screen-reader user had no way to tell
                // which section they were in. The mobile drawer already
                // set it; desktop did not.
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative py-2 transition-colors duration-[var(--motion-duration-short)] hover:text-[var(--color-brand-primary-text)] ${
                    isActive ? "font-semibold text-[var(--color-brand-primary-text)]" : ""
                  }`}
                >
                  {link.label}
                  {/* Active state carries three cues, not one: colour,
                      weight, and the rule — so it survives greyscale and
                      colour-blindness rather than relying on hue alone. */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-0.5 h-px bg-[var(--color-brand-primary-text)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right-side actions — a genuine 3-tier hierarchy: plain text
            (Log in) → minimal outlined button (Post Property) → solid
            brand-color button (Register), not three buttons of equal
            visual weight. */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Listing a property is a protected action, so guests are
              prompted in place rather than navigated into a gated route and
              then told to log in.

              ROLE-AWARE PROMINENCE: for a landlord this is their core task,
              so it takes the solid brand fill; for everyone else it stays
              outlined and secondary. Same destination and same label in both
              cases — only the visual weight changes, so the nav never
              reshuffles under a user who switches role. */}
          <ProtectedLink
            href="/dashboard/listings/new"
            actionLabel="Log in to list your property"
            suggestedRole="landlord"
            className={`u-ui hidden rounded-[var(--radius-control)] px-4 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)] sm:inline-block ${
              activeRole === "landlord"
                ? "bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)]"
                : "border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:border-[var(--color-deep-blue)]"
            }`}
          >
            List Your Property
          </ProtectedLink>

          {/* Dashboard as a first-class, always-visible destination for
              signed-in users.

              It previously existed ONLY inside the account dropdown, so
              reaching your own dashboard meant opening a menu to discover a
              link you had no reason to know was there. There is exactly one
              dashboard — /dashboard — and it is already role-aware internally
              (NAV_BY_ROLE + activeRole branching), so every role points at
              the same href and no per-role route is introduced. */}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={`u-ui hidden rounded-[var(--radius-control)] px-3 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)] md:inline-block ${
                isActivePath(pathname, "/dashboard")
                  ? "bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Dashboard
            </Link>
          )}

          {/* Notifications promoted out of the account menu to a top-level
              control. Buried one level down, it was undiscoverable — and an
              unread count nobody can see is not a notification system. */}
          {isAuthenticated && (
            <Link
              href="/dashboard/notifications"
              aria-label={
                unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
              }
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
              <Link
                href="/login"
                className="u-ui text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:text-[var(--color-text-primary)]"
              >
                Log in
              </Link>
              <Link href="/register">
                <Button size="dense">Register</Button>
              </Link>
              {/* Demo shortcut only — no real credential flow exists yet */}
              <Button variant="text" size="dense" className="hidden lg:inline-flex" onClick={login} title="Demo: simulate login">
                (demo login)
              </Button>
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
                {/* Avatar always; the role label only from `lg` up.
                    Measured at 375px, this control rendered 213px wide — the
                    full "Tenant / Buyer · Renting" string — leaving the right
                    cluster occupying ~70% of the bar. The identity it conveys
                    is worth keeping on wide screens, but on a phone the
                    initials carry it at a fraction of the width.

                    The unread dot that used to sit here has moved to the
                    dedicated bell alongside — two indicators for one count,
                    side by side, read as two separate things. */}
                <Avatar
                  name={activeRole ? roleLabels[activeRole].replace(" / ", " ") : "Account"}
                  size={22}
                  className="ring-0"
                />
                <span className="hidden lg:inline">
                  {activeRole
                    ? roleDisplay(activeRole, roles.find((r) => r.role === activeRole)?.context)
                    : "Account"}
                </span>
                <span className="sr-only lg:hidden">
                  {activeRole ? `Account menu, ${roleLabels[activeRole]}` : "Account menu"}
                </span>
                <IconChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] ${
                    accountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-2 shadow-[var(--elevation-lg)]"
                  >
                    <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                      Active role
                    </p>
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        role="menuitem"
                        onClick={() => {
                          setActiveRole(r.role);
                          setAccountMenuOpen(false);
                        }}
                        className={`block min-h-11 w-full rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm ${
                          activeRole === r.role ? "bg-[var(--color-surface-dense)] font-bold" : "hover:bg-[var(--color-surface-dense)]"
                        }`}
                      >
                        {roleDisplay(r.role, r.context)}
                      </button>
                    ))}
                    <div className="my-1.5 border-t border-[var(--color-border-hairline)]" />

                    {/* Ordered by how often it's wanted: Dashboard first
                        (the reason most people open this menu), then
                        Notifications, then account settings. Log out sits
                        last behind its own rule — reachable in one click,
                        but never competing with the things above it. */}
                    {ACCOUNT_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-sm font-bold text-[var(--color-brand-primary-text)] hover:bg-[var(--color-surface-dense)]"
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[var(--color-border-hairline)] md:hidden"
          >
            {/* NAV CLARITY PASS — the mobile drawer previously contained
                ONLY the browse links and Post Property: no Log in, no
                Register, no Dashboard, no Account, no Log out. An
                authenticated user on a phone could not reach their own
                dashboard or sign out from the menu at all.

                It is now the complete navigation, split into two labelled
                groups so the list reads as a structure rather than a pile of
                links: where you can GO, then what you can DO as this user. */}
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-4 pb-4 pt-2">
              <p className="u-label px-2 pb-1 pt-2 text-[var(--color-text-secondary)]">Browse</p>
              {PRIMARY_LINKS.map((link) => {
                const isActive = isActiveSection(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between rounded-[var(--radius-control)] px-2 text-sm font-bold ${
                      isActive
                        ? "bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
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

              <p className="u-label px-2 pb-1 pt-2 text-[var(--color-text-secondary)]">
                {isAuthenticated ? "Your account" : "Get started"}
              </p>

              <ProtectedLink
                href="/dashboard/listings/new"
                actionLabel="Log in to list your property"
                suggestedRole="landlord"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center rounded-[var(--radius-control)] px-2 text-sm font-bold text-[var(--color-brand-primary-text)] hover:bg-[var(--color-surface-dense)]"
              >
                List Your Property
              </ProtectedLink>

              {isAuthenticated ? (
                <>
                  {ACCOUNT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-[var(--color-brand-primary-text)] hover:bg-[var(--color-surface-dense)]"
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

                  {/* Role switching matters more on mobile, not less — it is
                      the control that determines what the dashboard and the
                      notification feed even contain. Shown only when the
                      user actually holds more than one role. */}
                  {roles.length > 1 && (
                    <>
                      <p className="u-label px-2 pb-1 pt-3 text-[var(--color-text-secondary)]">Active role</p>
                      {roles.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => {
                            setActiveRole(r.role);
                            setMobileMenuOpen(false);
                          }}
                          aria-pressed={activeRole === r.role}
                          className={`flex min-h-11 w-full items-center rounded-[var(--radius-control)] px-2 text-left text-sm ${
                            activeRole === r.role
                              ? "bg-[var(--color-surface-dense)] font-bold text-[var(--color-text-primary)]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
                          }`}
                        >
                          {roleDisplay(r.role, r.context)}
                        </button>
                      ))}
                    </>
                  )}

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
                    <Button className="w-full">Create an account</Button>
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
