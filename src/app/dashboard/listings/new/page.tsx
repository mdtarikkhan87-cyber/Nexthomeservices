"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { IconCheck, IconClose } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { useListings } from "@/lib/listings-context";
import {
  AMENITY_LABELS,
  Amenity,
  FURNISHING_LABELS,
  FurnishingStatus,
  PROPERTY_TYPE_LABELS,
  PropertyListing,
  PropertyType,
} from "@/lib/types";
import {
  DraftErrors,
  EMPTY_DRAFT,
  LISTING_STATES,
  ListingDraft,
  MAX_IMAGES,
  STEPS,
  firstInvalidStep,
  formatNaira,
  rejectImage,
  validateAll,
  validateStep,
} from "@/lib/listing-draft";
import { lgasForState } from "@/lib/nigeria-locations";

type Outcome = "blocked" | "subscription" | "submitted" | null;

// WIREFRAME_PLAN.md — Post a Property: listing facts → photos → payment
// (only if not subscribed, shown transparently before submission) → submit.
//
// REBUILT AS A GUIDED FLOW. What was here before looked complete but did not
// work: every field was uncontrolled with no ref or state, so `type` was the
// only value the component could actually read. Submitting discarded the
// address, price, bedrooms, description and photos. It also had no way to set
// title, state, property type, bathrooms, amenities or furnishing, meaning a
// listing created here could never be found by the filters that depend on
// them.
//
// The gate chain around it was already correct and is UNCHANGED: guests are
// intercepted by ProtectedLink in the header, the route is guarded by
// AuthRequired in dashboard/layout.tsx, and submission still requires the
// Landlord role to be `role-verified` and the subscription to be `active`.
export default function PostPropertyPage() {
  const router = useRouter();
  const { roles } = useAuth();
  const { notify } = useNotifications();
  const { addListing } = useListings();

  const landlordRole = roles.find((r) => r.role === "landlord");
  const isSubscribed = landlordRole?.subscriptionState === "active";

  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIndex].id;

  const set = useCallback(<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    // Changing the state resets the LGA: LGAs belong to exactly one state, so
    // keeping the old one would publish a location that does not exist.
    setDraft((prev) =>
      key === "state" ? { ...prev, state: value as string, lga: "" } : { ...prev, [key]: value }
    );
    // Clear this field's error as soon as the user edits it — leaving a stale
    // error under a field the user has already fixed is its own usability bug.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const toggleAmenity = useCallback((a: Amenity) => {
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  }, []);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      setImageError(null);
      const accepted: ListingDraft["images"] = [];

      for (const file of Array.from(files)) {
        const reason = rejectImage(file);
        if (reason) {
          setImageError(reason);
          continue;
        }
        accepted.push({ url: URL.createObjectURL(file), name: file.name, size: file.size });
      }

      setDraft((prev) => {
        const room = MAX_IMAGES - prev.images.length;
        if (accepted.length > room) {
          setImageError(`You can add up to ${MAX_IMAGES} photos.`);
          // Release the object URLs for files that won't be kept, otherwise
          // they leak for the lifetime of the document.
          accepted.slice(room).forEach((i) => URL.revokeObjectURL(i.url));
        }
        return { ...prev, images: [...prev.images, ...accepted.slice(0, Math.max(room, 0))] };
      });
      setErrors((prev) => ({ ...prev, images: undefined }));
    },
    []
  );

  const removeImage = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    setDraft((prev) => ({ ...prev, images: prev.images.filter((i) => i.url !== url) }));
  }, []);

  const goNext = () => {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleSubmit = () => {
    // Re-validate everything, not just the current step — a user can reach
    // Review and then go back and empty a field.
    const all = validateAll(draft);
    if (Object.keys(all).length > 0) {
      setErrors(all);
      const bad = firstInvalidStep(draft);
      if (bad) setStepIndex(STEPS.findIndex((s) => s.id === bad));
      return;
    }

    // Gate order is unchanged and deliberate: role verification is checked
    // before subscription (PRODUCT_DECISIONS.md §6) — being paid up doesn't
    // make an unverified landlord publishable.
    if (landlordRole?.state !== "role-verified") {
      setOutcome("blocked");
      return;
    }
    if (!isSubscribed) {
      setOutcome("subscription");
      return;
    }

    const listing: PropertyListing = {
      id: `draft-${Date.now()}`,
      type: draft.type,
      title: draft.title.trim(),
      price: Number(draft.price),
      currency: "NGN",
      state: draft.state,
      lga: draft.lga,
      bedrooms: Number(draft.bedrooms),
      bathrooms: Number(draft.bathrooms),
      propertyType: draft.propertyType as PropertyType,
      amenities: draft.amenities,
      ...(draft.type === "rent"
        ? {
            rentDuration: draft.rentDuration,
            ...(draft.furnishing ? { furnishing: draft.furnishing as FurnishingStatus } : {}),
          }
        : {}),
      photoUrl: draft.images[0].url,
      galleryUrls: draft.images.map((i) => i.url),
      // A new listing is never verified or live on creation — it enters
      // pending-review, which is the real product rule, not a placeholder.
      verified: false,
      status: "pending-review",
      viewCount: 0,
      description: draft.description.trim(),
    };

    addListing(listing);
    notify({
      role: "landlord",
      kind: "content-status",
      title: "Listing submitted for review",
      body: `“${listing.title}” is with our team. You'll be notified when it goes live.`,
      href: "/dashboard/listings",
      status: "pending",
    });
    setOutcome("submitted");
  };

  // ---------------------------------------------------------------- outcomes
  if (outcome === "blocked") {
    return (
      <div className="max-w-xl">
        <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">Almost ready to submit</h1>
        <div className="mt-4">
          <StatusBanner
            kind="blocked"
            title="Your Landlord account is still pending document review"
            description="Your listing details are kept as a draft. Once our team approves your documents, come back and submit it for review."
          />
        </div>
        <Button className="mt-5" variant="secondary" onClick={() => setOutcome(null)}>
          Back to draft
        </Button>
      </div>
    );
  }

  if (outcome === "subscription") {
    return (
      <div className="max-w-xl">
        <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">Subscribe to publish</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          There&apos;s no free listing tier — your details are kept as a draft. Subscribe to publish this and
          future listings.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button onClick={() => router.push("/dashboard/subscription")}>Go to Subscription</Button>
          <Button variant="secondary" onClick={() => setOutcome(null)}>
            Back to draft
          </Button>
        </div>
      </div>
    );
  }

  if (outcome === "submitted") {
    return (
      <div className="max-w-xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-status-verified)]/10">
          <IconCheck className="h-5 w-5 text-[var(--color-status-verified)]" />
        </span>
        <h1 className="u-heading mt-4 text-2xl text-[var(--color-text-primary)]">Listing submitted</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          “{draft.title.trim()}” is pending admin review. We&apos;ll notify you once it&apos;s approved and live.
        </p>
        {/* Stated plainly rather than quietly implied: this build has no
            backend, so the listing exists for this session only. Presenting
            it as saved would be inventing persistence that isn't there. */}
        <p className="u-ui mt-4 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-dense)]/60 p-3 text-[13px] text-[var(--color-text-secondary)]">
          Demo build: there is no server yet, so this listing lives in this browser session only and its
          photos aren&apos;t uploaded anywhere. It will disappear if you reload.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button onClick={() => router.push("/dashboard/listings")}>Back to My Listings</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setStepIndex(0);
              setOutcome(null);
            }}
          >
            List another property
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ wizard
  const fieldsForStep = (
    <>
      {step === "basics" && (
        <>
          <div>
            <Label htmlFor="intent">Are you renting or selling?</Label>
            <div id="intent" className="mt-1 inline-flex rounded-[var(--radius-control)] bg-[var(--color-surface-dense)] p-1">
              {(["rent", "sale"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  aria-pressed={draft.type === t}
                  className={`rounded-[var(--radius-control)] px-4 py-2 text-sm font-bold transition-colors duration-[var(--motion-duration-short)] ${
                    draft.type === t
                      ? "bg-[var(--color-brand-primary)] text-white"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {t === "rent" ? "For Rent" : "For Sale"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Listing title</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              error={errors.title}
              hint="What a renter sees first — e.g. “2-Bedroom Flat, Lekki Phase 1”."
              placeholder="2-Bedroom Flat, Lekki Phase 1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ptype">Property type</Label>
              <Select
                id="ptype"
                value={draft.propertyType}
                onChange={(e) => set("propertyType", e.target.value as PropertyType)}
                error={errors.propertyType}
              >
                <option value="">Select a type</option>
                {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select
                id="state"
                value={draft.state}
                onChange={(e) => set("state", e.target.value)}
                error={errors.state}
                hint="A fixed list keeps search results accurate."
              >
                <option value="">Select a state</option>
                {LISTING_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            {/* LGA is required, not optional: seekers filter by the area they
                actually want to live in, and a listing recorded only as
                "Lagos" is invisible to every one of those searches. The
                options come from the same table the filters read. */}
            <div>
              <Label htmlFor="lga">Local Government Area</Label>
              <Select
                id="lga"
                value={draft.lga}
                disabled={!draft.state}
                onChange={(e) => set("lga", e.target.value)}
                error={errors.lga}
                hint={
                  draft.state
                    ? "Seekers filter by LGA, so this is how your listing gets found."
                    : "Choose a state first."
                }
              >
                <option value="">{draft.state ? "Select an LGA" : "Select a state first"}</option>
                {lgasForState(draft.state).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <div>
            <Label htmlFor="price">{draft.type === "rent" ? "Annual rent (₦)" : "Sale price (₦)"}</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.price}
              onChange={(e) => set("price", e.target.value)}
              error={errors.price}
              hint={draft.price && !errors.price ? formatNaira(draft.price) : "Enter the full amount in naira."}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Select
                id="bedrooms"
                value={draft.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                error={errors.bedrooms}
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Select
                id="bathrooms"
                value={draft.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                error={errors.bathrooms}
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Rent-only fields — a sale listing has no lease duration, and
              furnishing is a rental concern in this market. */}
          {draft.type === "rent" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="duration">Rental duration</Label>
                <Select
                  id="duration"
                  value={draft.rentDuration}
                  onChange={(e) => set("rentDuration", e.target.value as ListingDraft["rentDuration"])}
                >
                  <option value="long-term">Long-Term</option>
                  <option value="short-term">Short-Term</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="furnishing">Furnishing (optional)</Label>
                <Select
                  id="furnishing"
                  value={draft.furnishing}
                  onChange={(e) => set("furnishing", e.target.value as FurnishingStatus)}
                >
                  <option value="">Not specified</option>
                  {(Object.keys(FURNISHING_LABELS) as FurnishingStatus[]).map((f) => (
                    <option key={f} value={f}>
                      {FURNISHING_LABELS[f]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <fieldset>
            <legend className="mb-1.5 block text-sm font-bold text-[var(--color-text-primary)]">
              Amenities (optional)
            </legend>
            <p className="u-ui mb-3 text-[13px] text-[var(--color-text-secondary)]">
              These are what renters filter on, so pick everything that applies.
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(AMENITY_LABELS) as Amenity[]).map((a) => {
                const on = draft.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    aria-pressed={on}
                    className={`u-ui inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)] ${
                      on
                        ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white"
                        : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-deep-blue)]"
                    }`}
                  >
                    {on && <IconCheck className="h-3 w-3" />}
                    {AMENITY_LABELS[a]}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </>
      )}

      {step === "media" && (
        <>
          <div>
            <Label htmlFor="photos">Photos</Label>
            <p className="u-ui mb-3 text-[13px] text-[var(--color-text-secondary)]">
              Up to {MAX_IMAGES} images, 5MB each. The first is used as the cover.
            </p>

            <input
              ref={fileInputRef}
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                // Reset so re-selecting the same file still fires onChange.
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-default)] px-4 py-8 text-center transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-surface-dense)]/40"
            >
              <span className="text-sm font-bold text-[var(--color-brand-primary-text)]">Choose photos</span>
              <span className="u-ui text-[13px] text-[var(--color-text-secondary)]">
                {draft.images.length > 0
                  ? `${draft.images.length} of ${MAX_IMAGES} added`
                  : "PNG or JPG, up to 5MB each"}
              </span>
            </button>

            {imageError && <FieldError error={imageError} />}
            {errors.images && <FieldError error={errors.images} />}

            {draft.images.length > 0 && (
              <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {draft.images.map((img, i) => (
                  <li key={img.url} className="group relative">
                    {/* Deliberately a plain <img>: these are blob: object
                        URLs from the user's own disk, which next/image cannot
                        optimize and which aren't in next.config remotePatterns. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Photo ${i + 1}: ${img.name}`}
                      className="aspect-square w-full rounded-[var(--radius-control)] object-cover"
                    />
                    {i === 0 && (
                      <span className="u-label absolute left-1.5 top-1.5 rounded-full bg-[var(--color-surface-raised)]/92 px-2 py-1 text-[var(--color-text-primary)]">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.url)}
                      aria-label={`Remove ${img.name}`}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-dark-blue)]/70 text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-status-rejected)]"
                    >
                      <IconClose className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              error={errors.description}
              hint={`${draft.description.trim().length} characters — aim for a short paragraph.`}
              placeholder="Describe the property, the area, and what makes it worth a viewing."
            />
          </div>
        </>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-5">
          <p className="u-ui text-sm text-[var(--color-text-secondary)]">
            Check the details below. Once submitted, your listing goes to our team for review before it
            appears publicly.
          </p>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] p-5 sm:grid-cols-3">
            {[
              { k: "Intent", v: draft.type === "rent" ? "For Rent" : "For Sale" },
              { k: "Title", v: draft.title.trim() || "—" },
              { k: "Type", v: draft.propertyType ? PROPERTY_TYPE_LABELS[draft.propertyType] : "—" },
              { k: "State", v: draft.state || "—" },
              { k: "LGA", v: draft.lga || "—" },
              { k: draft.type === "rent" ? "Annual rent" : "Sale price", v: formatNaira(draft.price) },
              { k: "Bedrooms", v: draft.bedrooms || "—" },
              { k: "Bathrooms", v: draft.bathrooms || "—" },
              ...(draft.type === "rent"
                ? [
                    { k: "Duration", v: draft.rentDuration === "short-term" ? "Short-Term" : "Long-Term" },
                    {
                      k: "Furnishing",
                      v: draft.furnishing ? FURNISHING_LABELS[draft.furnishing] : "Not specified",
                    },
                  ]
                : []),
              { k: "Photos", v: `${draft.images.length}` },
            ].map((row) => (
              <div key={row.k}>
                <dt className="u-label text-[var(--color-text-secondary)]">{row.k}</dt>
                <dd className="u-ui mt-1.5 truncate font-semibold text-[var(--color-text-primary)]">{row.v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <p className="u-label text-[var(--color-text-secondary)]">Amenities</p>
            <p className="u-ui mt-1.5 text-sm text-[var(--color-text-primary)]">
              {draft.amenities.length
                ? draft.amenities.map((a) => AMENITY_LABELS[a]).join(" · ")
                : "None selected"}
            </p>
          </div>

          <div>
            <p className="u-label text-[var(--color-text-secondary)]">Description</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {draft.description.trim() || "—"}
            </p>
          </div>

          {Object.keys(errors).length > 0 && (
            <StatusBanner
              kind="blocked"
              title="Some details still need attention"
              description="We've taken you back to the step that needs fixing."
            />
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="u-heading text-2xl text-[var(--color-text-primary)] sm:text-3xl">List Your Property</h1>
      <p className="u-ui mt-2 text-sm text-[var(--color-text-secondary)]">
        Four short steps. Nothing is published until our team has reviewed it.
      </p>

      {/* Progress. A stepper rather than one long form: it makes the length of
          the task visible up front, which is what stops a listing form feeling
          intimidating. Completed steps are clickable so review-and-correct
          doesn't mean starting over. */}
      <ol className="mt-7 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "todo";
          return (
            <li key={s.id} className="flex min-w-0 flex-1 flex-col gap-2">
              <button
                type="button"
                disabled={i > stepIndex}
                onClick={() => i < stepIndex && setStepIndex(i)}
                aria-current={state === "current" ? "step" : undefined}
                className={`h-1 w-full rounded-full transition-colors duration-[var(--motion-duration-standard)] ${
                  state === "todo"
                    ? "bg-[var(--color-surface-dense)]"
                    : "bg-[var(--color-brand-primary)] enabled:cursor-pointer"
                }`}
              >
                <span className="sr-only">
                  {s.label} — {state === "done" ? "completed" : state === "current" ? "current step" : "not started"}
                </span>
              </button>
              <span
                className={`u-ui truncate text-[12px] font-semibold ${
                  state === "current"
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === "review") handleSubmit();
          else goNext();
        }}
      >
        {fieldsForStep}

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--color-border-hairline)] pt-5">
          <Button type="button" variant="text" size="dense" onClick={goBack} disabled={stepIndex === 0}>
            Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="u-ui text-[13px] text-[var(--color-text-secondary)]">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            <Button type="submit">{step === "review" ? "Submit for review" : "Continue"}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
