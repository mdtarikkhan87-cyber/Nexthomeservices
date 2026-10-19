"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  IconBell,
  IconCreditCard,
  IconGrid,
  IconHelp,
  IconHome,
  IconMegaphone,
  IconMessageCircle,
  IconPlus,
  IconStar,
  IconUser,
  IconWrench,
} from "@/components/ui/icons";
import { useNotifications } from "@/lib/notification-context";
import { ROLE_DASHBOARD_HOME, ROLE_LABELS } from "@/lib/roles";
import { RoleName } from "@/lib/types";
import { cn } from "@/lib/utils";

// COMPONENT_ARCHITECTURE.md §4: Dashboard Sidebar/Nav — shared structure,
// role-specific content injected (never a separate component per role).
//
// ROLE-SELECTION REVISION (31 Aug 2026): "Overview" points at
// ROLE_DASHBOARD_HOME[role] rather than a hard-coded /dashboard, because two
// roles have a named home of their own. It reads the same table
// /dashboard/page.tsx redirects by, so the nav can never point somewhere the
// entry route immediately redirects away from.
//
// This nav decides what is OFFERED, never what is permitted — it is a view,
// scoped to the role being viewed. Access is enforced by RoleScoped in the
// dashboard layout, against the permanent user.roles list.

type NavItem = { href: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> };

const NAV_BY_ROLE: Record<RoleName, NavItem[]> = {
  landlord: [
    { href: ROLE_DASHBOARD_HOME.landlord, label: "Overview", Icon: IconGrid },
    { href: "/dashboard/listings", label: "My Listings", Icon: IconHome },
    { href: "/dashboard/listings/new", label: "List Your Property", Icon: IconPlus },
    { href: "/dashboard/subscription", label: "Subscription", Icon: IconCreditCard },
    { href: "/dashboard/messages", label: "Messages", Icon: IconMessageCircle },
    { href: "/dashboard/notifications", label: "Notifications", Icon: IconBell },
  ],
  "tenant-buyer": [
    { href: ROLE_DASHBOARD_HOME["tenant-buyer"], label: "Overview", Icon: IconGrid },
    { href: "/dashboard/saved", label: "Saved Homes", Icon: IconStar },
    { href: "/dashboard/messages", label: "Messages", Icon: IconMessageCircle },
    { href: "/dashboard/notifications", label: "Notifications", Icon: IconBell },
  ],
  "service-provider": [
    { href: ROLE_DASHBOARD_HOME["service-provider"], label: "Overview", Icon: IconGrid },
    { href: "/dashboard/service-listing", label: "My Service Listing", Icon: IconWrench },
    { href: "/dashboard/messages", label: "Messages", Icon: IconMessageCircle },
    { href: "/dashboard/notifications", label: "Notifications", Icon: IconBell },
  ],
  advertiser: [
    { href: ROLE_DASHBOARD_HOME.advertiser, label: "Overview", Icon: IconGrid },
    { href: "/dashboard/ads", label: "My Advertisements", Icon: IconMegaphone },
    { href: "/dashboard/ads/new", label: "Submit Advertisement", Icon: IconPlus },
    { href: "/dashboard/notifications", label: "Notifications", Icon: IconBell },
  ],
};

// The same two links sit under every role's nav (the design's Settings and Help
// rows): the account page and the help page, both existing routes.
const FOOTER_LINKS: NavItem[] = [
  { href: "/account", label: "Profile", Icon: IconUser },
  { href: "/help", label: "Help & support", Icon: IconHelp },
];

const ROLE_ICON: Record<RoleName, NavItem["Icon"]> = {
  landlord: IconHome,
  "tenant-buyer": IconStar,
  "service-provider": IconWrench,
  advertiser: IconMegaphone,
};

export function DashboardNav({ role }: { role: RoleName }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];
  // Count is already scoped to the active role by the provider.
  const { unreadCount } = useNotifications();
  const RoleIcon = ROLE_ICON[role];

  const row = (active: boolean) =>
    cn(
      "flex items-center gap-3 whitespace-nowrap font-bold transition-colors duration-[var(--motion-duration-short)]",
      // phones: a pill in a scrolling strip
      "h-10 rounded-full border px-4 text-sm",
      // from lg: a full-width row of the sidebar
      "lg:h-11 lg:rounded-[10px] lg:border-transparent lg:px-3",
      active
        ? "border-[color-mix(in_srgb,var(--color-blue)_30%,white)] bg-[color-mix(in_srgb,var(--color-light-blue)_26%,white)] text-[var(--color-deep-blue)]"
        : "border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-light-blue)_10%,white)] lg:bg-transparent",
    );

  // Phones: a row of tabs that scrolls inside its own strip. From lg: the
  // design's 264px sidebar — a Workspace card naming the role, the role's links
  // with icons, and Profile / Help at the foot — flush with the page edge.
  return (
    <aside className="border-b border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] lg:w-[264px] lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-5rem)] lg:flex-col lg:gap-6 lg:overflow-y-auto lg:px-4 lg:py-6">
        <div className="hidden items-center gap-3 rounded-[14px] border border-[var(--color-border-hairline)] bg-[color-mix(in_srgb,var(--color-light-blue)_10%,white)] p-3 lg:flex">
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-deep-blue)] text-white">
            <RoleIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="u-label text-[11px] text-[var(--color-text-secondary)]">Workspace</span>
            <span className="truncate text-[15px] font-bold text-[var(--color-text-primary)]">{ROLE_LABELS[role]}</span>
          </span>
        </div>

        <nav aria-label={`${ROLE_LABELS[role]} dashboard`}>
          <ul className="flex gap-2 overflow-x-auto px-4 py-2.5 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-0">
            {items.map((item) => {
              const isNotifications = item.href === "/dashboard/notifications";
              const active = pathname === item.href;
              return (
                <li key={item.href} className="shrink-0">
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={row(active)}>
                    <item.Icon className="hidden h-5 w-5 shrink-0 lg:block" />
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {/* Unread count carries a text label for screen readers rather
                        than relying on a bare number. */}
                    {isNotifications && unreadCount > 0 && (
                      <span
                        className={cn(
                          "u-numeric flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-xs font-bold",
                          active ? "bg-white text-[var(--color-deep-blue)]" : "bg-[var(--color-blue)] text-white",
                        )}
                      >
                        {unreadCount}
                        <span className="sr-only"> unread notifications</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden flex-col gap-1 border-t border-[var(--color-border-hairline)] pt-4 lg:flex">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={row(false)}>
              <item.Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
