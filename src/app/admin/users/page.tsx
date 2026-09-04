"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, StatusKind } from "@/components/ui/StatusBadge";
import { useAdminUsers } from "@/lib/admin-mock-data";
import { ROLE_LABELS } from "@/lib/roles";
import { RoleName, RoleState } from "@/lib/types";

const ROLE_STATE_BADGE: Record<RoleState, { kind: StatusKind; label: string }> = {
  "role-verified": { kind: "verified", label: "Verified" },
  "pending-admin-document-review": { kind: "pending", label: "Pending Document Review" },
  "role-added": { kind: "pending", label: "Role Added" },
};

export default function AdminUsersPage() {
  const { users, verifyUserRole, rejectUserRole } = useAdminUsers();
  const [rejecting, setRejecting] = useState<{ userId: string; userName: string; role: RoleName } | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Users</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        Every account and the roles it holds. Verifying clears document review; rejecting sends it back to
        Role Added.
      </p>

      {users.length === 0 ? (
        <EmptyState className="mt-6" title="No users yet" />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]"
            >
              <p className="font-bold text-[var(--color-text-primary)]">{user.name}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {user.roles.map((row) => {
                  const badge = ROLE_STATE_BADGE[row.state];
                  return (
                    <li
                      key={row.role}
                      className="flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] px-3.5 py-2.5"
                    >
                      <StatusBadge kind={badge.kind} label={badge.label} dense />
                      <p className="min-w-0 flex-1 font-bold text-[var(--color-text-primary)]">
                        {ROLE_LABELS[row.role]}
                      </p>
                      {row.state !== "role-verified" && (
                        <Button variant="secondary" size="dense" onClick={() => verifyUserRole(user.id, row.role)}>
                          Verify
                        </Button>
                      )}
                      {row.state === "pending-admin-document-review" && (
                        <Button
                          variant="destructive"
                          size="dense"
                          onClick={() => setRejecting({ userId: user.id, userName: user.name, role: row.role })}
                        >
                          Reject
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        open={rejecting !== null}
        title={rejecting ? `Reject ${ROLE_LABELS[rejecting.role]} for ${rejecting.userName}?` : ""}
        description="Their document review is denied and the role returns to Role Added, unverified."
        confirmLabel="Reject"
        onCancel={() => setRejecting(null)}
        onConfirm={() => {
          if (rejecting) rejectUserRole(rejecting.userId, rejecting.role);
          setRejecting(null);
        }}
      />
    </div>
  );
}
