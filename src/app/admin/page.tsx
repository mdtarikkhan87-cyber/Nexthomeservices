"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, statusBadgeColor, StatusKind } from "@/components/ui/StatusBadge";
import { AdminListingRow, useAdminComplaints, useAdminListings, useAdminUsers } from "@/lib/admin-mock-data";
import { ROLE_LABELS } from "@/lib/roles";
import { RoleName } from "@/lib/types";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * One KPI tile. The count is the click target (a real Link, not a button
 * inside a link) so the whole card navigates — Overview is meant to be
 * jumped off from, not just read.
 *
 * The number is tinted to match its badge's color, read from StatusBadge
 * itself (statusBadgeColor) rather than a second copy of that table — so if
 * "pending"'s color ever changes, this follows without a separate edit.
 * Today that means pending/open render in the same deep-blue as live/verified
 * (globals.css defines no amber or green status color, only blue-family +
 * terracotta for rejected — see IMPLEMENTATION_NOTES.md #12 on why an
 * invented shade isn't added here without a brand-owner decision), so the
 * tint is a subtler cue than color alone — which is also why the badge
 * (icon + label) stays the primary signal, per DESIGN_SYSTEM.md §7.
 */
function StatTile({
  href,
  count,
  label,
  badgeKind,
  badgeLabel,
  captions,
}: {
  href: string;
  count: number;
  label: string;
  badgeKind: StatusKind;
  badgeLabel: string;
  captions?: string[];
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)] transition-[border-color,box-shadow] duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:shadow-[var(--elevation-sm)]"
    >
      <StatusBadge kind={badgeKind} label={badgeLabel} dense className="self-start" />
      <div>
        <p className="text-3xl font-bold" style={{ color: statusBadgeColor(badgeKind) }}>
          {count}
        </p>
        {captions?.map((caption) => (
          <p key={caption} className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            {caption}
          </p>
        ))}
      </div>
      <p className="u-ui text-sm font-bold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
        {label}
      </p>
    </Link>
  );
}

function StatTileGrid({ children }: { children: ReactNode }) {
  return <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>;
}

// One "needs attention" row — either a user's pending role or a pending
// listing. No complaint variant: complaints are deliberately excluded from
// this list (a scoping decision, not a data-availability gap — resolving a
// complaint is a real action, see useAdminComplaints() below).
type AttentionItem =
  | { source: "user-role"; userId: string; userName: string; role: RoleName }
  | { source: "listing"; row: AdminListingRow };

export default function AdminOverviewPage() {
  const { users, verifyUserRole, rejectUserRole } = useAdminUsers();
  const { listings, pending, approveListing, rejectListing } = useAdminListings();
  const { complaints } = useAdminComplaints();
  const [rejecting, setRejecting] = useState<AttentionItem | null>(null);

  const pendingUsers = users.filter((user) =>
    user.roles.some((role) => role.state === "pending-admin-document-review")
  ).length;
  const liveListings = listings.filter((row) => row.status === "live");
  const rejectedListings = listings.filter((row) => row.status === "rejected").length;
  const openComplaints = complaints.filter((c) => c.status === "open").length;

  const byKind = (rows: AdminListingRow[], kind: AdminListingRow["kind"]) =>
    rows.filter((row) => row.kind === kind).length;

  const pendingBreakdown = `${pluralize(byKind(pending, "property"), "property", "properties")}, ${pluralize(
    byKind(pending, "service"),
    "service"
  )}`;
  const liveBreakdown = `${pluralize(byKind(liveListings, "property"), "property", "properties")}, ${pluralize(
    byKind(liveListings, "service"),
    "service"
  )}`;

  // No rejected caption on Pending users: unlike listings, RoleState
  // (lib/types.ts) has no "rejected" state — rejecting a role's document
  // review returns it to "role-added", not a terminal rejected state — so
  // there is nothing real to count here without inventing a state that
  // doesn't exist in the model.

  // "Oldest" pending items, in the absence of any created/submitted
  // timestamp anywhere in this mock data (AdminUser, PropertyListing,
  // ServiceListing all lack one) — array order stands in for it, same
  // placeholder-not-silent spirit as the rest of this mock layer. Users
  // before listings is an arbitrary but fixed, stated tiebreak.
  const attentionItems: AttentionItem[] = [
    ...users.flatMap((user) =>
      user.roles
        .filter((role) => role.state === "pending-admin-document-review")
        .map((role): AttentionItem => ({ source: "user-role", userId: user.id, userName: user.name, role: role.role }))
    ),
    ...pending.map((row): AttentionItem => ({ source: "listing", row })),
  ].slice(0, 3);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Admin overview</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        Manage users, listings, and complaints from the nav on the left.
      </p>

      <StatTileGrid>
        <StatTile
          href="/admin/users"
          count={pendingUsers}
          label="Pending users"
          badgeKind="pending"
          badgeLabel="Pending"
        />
        <StatTile
          href="/admin/listings"
          count={pending.length}
          label="Pending listings"
          badgeKind="pending"
          badgeLabel="Pending"
          captions={[pendingBreakdown]}
        />
        <StatTile
          href="/admin/listings"
          count={liveListings.length}
          label="Live listings"
          badgeKind="live"
          badgeLabel="Live"
          captions={[liveBreakdown, `${rejectedListings} rejected`]}
        />
        <StatTile
          href="/admin/complaints"
          count={openComplaints}
          label="Open complaints"
          badgeKind="pending"
          badgeLabel="Open"
        />
      </StatTileGrid>

      <div className="mt-8">
        <h2 className="u-label text-[var(--color-text-secondary)]">Needs your attention</h2>

        {attentionItems.length === 0 ? (
          <EmptyState
            className="mt-2.5"
            title="You're all caught up"
            description="No pending users or listings need review right now."
          />
        ) : (
          <ul className="mt-2.5 flex flex-col gap-1">
            {attentionItems.map((item) => {
              if (item.source === "user-role") {
                const key = `${item.userId}:${item.role}`;
                return (
                  <li
                    key={key}
                    className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] px-3 py-1.5"
                  >
                    <StatusBadge kind="pending" label="Pending Document Review" dense />
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--color-text-primary)]">
                      {item.userName} — {ROLE_LABELS[item.role]}
                    </p>
                    <Button variant="secondary" size="dense" onClick={() => verifyUserRole(item.userId, item.role)}>
                      Verify
                    </Button>
                    <Button variant="destructive" size="dense" onClick={() => setRejecting(item)}>
                      Reject
                    </Button>
                  </li>
                );
              }

              const { row } = item;
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] px-3 py-1.5"
                >
                  <StatusBadge kind="pending" dense />
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--color-text-primary)]">
                    {row.title}
                  </p>
                  <Button variant="secondary" size="dense" onClick={() => approveListing(row.id)}>
                    Approve
                  </Button>
                  <Button variant="destructive" size="dense" onClick={() => setRejecting(item)}>
                    Reject
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmationDialog
        open={rejecting !== null}
        title={
          rejecting?.source === "user-role"
            ? `Reject ${ROLE_LABELS[rejecting.role]} for ${rejecting.userName}?`
            : rejecting?.source === "listing"
              ? `Reject "${rejecting.row.title}"?`
              : ""
        }
        description={
          rejecting?.source === "user-role"
            ? "Their document review is denied and the role returns to Role Added, unverified."
            : "It will no longer be visible to the public."
        }
        confirmLabel="Reject"
        onCancel={() => setRejecting(null)}
        onConfirm={() => {
          if (rejecting?.source === "user-role") rejectUserRole(rejecting.userId, rejecting.role);
          if (rejecting?.source === "listing") rejectListing(rejecting.row.id);
          setRejecting(null);
        }}
      />
    </div>
  );
}
