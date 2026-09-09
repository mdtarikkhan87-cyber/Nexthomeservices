"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Modeled on DashboardNav.tsx's shared shell, minus the per-role table and
// notification badge — admin has exactly one nav shape, not one per role.
const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/complaints", label: "Complaints" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] px-4 py-2 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:px-3 lg:py-8">
      {ADMIN_NAV_ITEMS.map((item) => {
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
          </Link>
        );
      })}
    </nav>
  );
}
