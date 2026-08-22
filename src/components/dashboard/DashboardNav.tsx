"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/lib/notification-context";
import { RoleName } from "@/lib/types";
import { cn } from "@/lib/utils";

// COMPONENT_ARCHITECTURE.md §4: Dashboard Sidebar/Nav — shared structure,
// role-specific content injected (never a separate component per role).
const NAV_BY_ROLE: Record<RoleName, { href: string; label: string }[]> = {
  landlord: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/listings", label: "My Listings" },
    { href: "/dashboard/listings/new", label: "List Your Property" },
    { href: "/dashboard/subscription", label: "Subscription" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/notifications", label: "Notifications" },
  ],
  "tenant-buyer": [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/saved", label: "Saved Homes" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/notifications", label: "Notifications" },
  ],
  "service-provider": [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/service-listing", label: "My Service Listing" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/notifications", label: "Notifications" },
  ],
  advertiser: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/ads", label: "My Advertisements" },
    { href: "/dashboard/ads/new", label: "Submit Advertisement" },
    { href: "/dashboard/notifications", label: "Notifications" },
  ],
};

export function DashboardNav({ role }: { role: RoleName }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];
  // Count is already scoped to the active role by the provider.
  const { unreadCount } = useNotifications();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] px-4 py-2 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:px-3 lg:py-8">
      {items.map((item) => {
        const isNotifications = item.href === "/dashboard/notifications";
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-bold whitespace-nowrap transition-colors duration-[var(--motion-duration-short)]",
              isActive
                ? "bg-[var(--color-brand-primary)] text-white shadow-[var(--elevation-xs)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {item.label}
            {/* Unread count carries a text label for screen readers rather
                than relying on a bare number, which reads as meaningless
                out of visual context. */}
            {isNotifications && unreadCount > 0 && (
              <span
                className={cn(
                  "u-numeric ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                  isActive ? "bg-white/25 text-white" : "bg-[var(--color-brand-primary)] text-white"
                )}
              >
                {unreadCount}
                <span className="sr-only"> unread notifications</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
