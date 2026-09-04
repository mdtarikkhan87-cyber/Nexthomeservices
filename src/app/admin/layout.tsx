"use client";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminComplaintsProvider } from "@/lib/admin-mock-data";

// Mirrors dashboard/layout.tsx's shell shape (shared frame, gate wraps
// everything so every /admin/* child route is covered in one place) but
// with AdminGate instead of AuthRequired + RoleScoped — admin is a single
// flag, not an auth-then-role pair.
//
// AdminComplaintsProvider lives here specifically (not inside AdminGate,
// though it wouldn't matter either way today) because this layout is what
// persists across navigation between sibling /admin/* routes — the page
// components underneath it remount on every route change, so this is the
// one place complaint-resolution state can actually survive going from
// /admin/complaints back to /admin and having the Overview tile agree.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminGate>
      <AdminComplaintsProvider>
        <div className="mx-auto flex max-w-6xl flex-col lg:flex-row">
          <AdminNav />
          <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:py-10">{children}</div>
        </div>
      </AdminComplaintsProvider>
    </AdminGate>
  );
}
