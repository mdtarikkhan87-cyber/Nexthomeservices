"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/notification-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { apiGetPresignedUpload } from "@/lib/backend-client";
import { apiCreateAdvertisement } from "@/lib/ads-client";

// IMPLEMENTATION NOTE: whether pricing is shown before or after admin sets
// custom terms is unresolved (SCREEN_BLUEPRINTS.md Readiness Check item 7).
// This screen shows a "pending terms" state after submission rather than
// assuming upfront self-serve pricing — a placeholder, not a decision.
export default function SubmitAdvertisementPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headline, setHeadline] = useState("");
  // "Ad text" in the UI maps to the backend's `headline` — the backend has
  // no separate body-copy field for an ad, only headline/imageUrl/linkUrl.
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { notify } = useNotifications();

  if (submitted) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Advertisement submitted</h1>
        <div className="mt-4">
          <StatusBanner
            kind="pending"
            title="Pending content review and terms"
            description="Our team will review your ad and set placement, duration, and cost. You'll confirm and pay once those terms are ready."
          />
        </div>
        <Button className="mt-5" onClick={() => router.push("/dashboard/ads")}>
          Back to My Advertisements
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Submit Advertisement</h1>
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!selectedFile) {
            setError("Add an image for your ad.");
            return;
          }
          setError(null);
          setIsSubmitting(true);
          try {
            const presigned = await apiGetPresignedUpload({
              purpose: "ad-image",
              fileName: selectedFile.name,
              fileType: selectedFile.type,
            });
            await fetch(presigned.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": selectedFile.type },
              body: selectedFile,
            });
            const imageUrl = presigned.publicUrl || presigned.key;

            await apiCreateAdvertisement({ headline, linkUrl, imageUrl });

            setSubmitted(true);
            notify({
              role: "advertiser",
              kind: "content-status",
              title: "Advertisement submitted",
              body: "We're reviewing your submission and will confirm placement and terms.",
              href: "/dashboard/ads",
              status: "pending",
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Submission failed. Try again.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {error && (
          <p className="text-sm font-medium text-[var(--color-status-rejected)]" role="alert">
            {error}
          </p>
        )}
        <div>
          <Label htmlFor="ad-title">Ad title</Label>
          <Input
            id="ad-title"
            required
            minLength={3}
            placeholder="What is this ad promoting?"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ad-copy">Ad text</Label>
          {/* Not sent anywhere yet — the backend's Advertisement has no body-
              copy field, only headline/imageUrl/linkUrl. Kept in the UI
              pending a product decision on whether ad body text is needed. */}
          <Textarea id="ad-copy" rows={3} />
        </div>
        <div>
          <Label htmlFor="ad-link">Link</Label>
          <Input
            id="ad-link"
            type="url"
            required
            placeholder="https://"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ad-image">Image</Label>
          <input
            id="ad-image"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-3 text-sm"
          />
        </div>
        <Button type="submit" className="self-start" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
