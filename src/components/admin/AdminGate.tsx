"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { IconLock } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";

// ---------------------------------------------------------------------------
// The admin route guard — parallel to RoleScoped.tsx, but admin is not a
// RoleName (see lib/auth-context.tsx AuthUser.isAdmin). It asks exactly one
// question:
//
//     user?.isAdmin
//
// TWO OUTCOMES:
//
//   isAdmin       → render the admin surface.
//   not admin     → BLOCK. Unlike RoleScoped's "Add the X role" (a real,
//     self-serve flow), there is no way to acquire admin from inside the
//     product — it is a hardcoded placeholder (lib/admin.ts) reached only by
//     signing in with that one email. So the way forward named here is just
//     "log in with the admin account", not an in-place upgrade.
// ---------------------------------------------------------------------------

export function AdminGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user?.isAdmin) return <AdminRequired />;

  return <>{children}</>;
}

function AdminRequired() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--elevation-xs)]">
        <span
          aria-hidden
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
        >
          <IconLock className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">This page is for admins only</h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
          You need to be signed in with the admin account to view this section.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/login" className="flex">
            <Button className="w-full">Go to login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
