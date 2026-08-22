"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/notification-context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = ["Electrician", "Plumber", "Mechanic", "Carpenter", "Painter"];

export default function ServiceListingPage() {
  const { roles } = useAuth();
  const providerRole = roles.find((r) => r.role === "service-provider");
  const [submitted, setSubmitted] = useState(false);
  const { notify } = useNotifications();

  // PRODUCT_DECISIONS.md §6: submission requires the role itself to be
  // verified, distinct from account-level authentication.
  if (providerRole?.state === "pending-admin-document-review") {
    return (
      <div className="max-w-xl">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Service Listing</h1>
        <StatusBanner
          kind="blocked"
          title="Your Service Provider account is still pending document review"
          description="You'll be able to create your listing once our team approves your documents."
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Service Listing</h1>
        {submitted && <StatusBadge kind="pending" />}
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          notify({
            role: "service-provider",
            kind: "content-status",
            title: "Service listing submitted",
            body: "Our team is reviewing your service listing before it appears in the directory.",
            href: "/dashboard/service-listing",
            status: "pending",
          });
        }}
      >
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" required>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="svc-desc">Description</Label>
          <Textarea id="svc-desc" required rows={4} placeholder="Describe your services and coverage area" />
        </div>
        <div>
          <Label htmlFor="svc-contact">Contact details</Label>
          <Input id="svc-contact" required placeholder="Phone number customers can reach you on" />
        </div>
        <Button type="submit" className="self-start">
          {submitted ? "Resubmit" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
