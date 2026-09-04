"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminComplaints } from "@/lib/admin-mock-data";

export default function AdminComplaintsPage() {
  const { complaints, resolveComplaint } = useAdminComplaints();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Complaints</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        Reports submitted through the public Report a Concern form.
      </p>

      {complaints.length === 0 ? (
        <EmptyState className="mt-6" title="No complaints" description="Nothing has been reported yet." />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {complaints.map((complaint) => (
            <li
              key={complaint.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  kind={complaint.status === "resolved" ? "verified" : "pending"}
                  label={complaint.status === "resolved" ? "Resolved" : "Open"}
                  dense
                />
                <p className="min-w-0 flex-1 font-bold text-[var(--color-text-primary)]">{complaint.subject}</p>
                {complaint.status === "open" && (
                  <Button variant="secondary" size="dense" onClick={() => resolveComplaint(complaint.id)}>
                    Resolve
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{complaint.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
