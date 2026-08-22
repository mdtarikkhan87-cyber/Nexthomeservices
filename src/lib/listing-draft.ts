import { Amenity, FurnishingStatus, ListingType, PropertyType, RentDuration } from "./types";

// ---------------------------------------------------------------------------
// The listing draft: its shape, its validation rules, and the mapping from a
// completed draft to a PropertyListing.
//
// Kept out of the page component so the rules are readable in one place and
// each wizard step can validate only its own fields — the wizard must never
// block someone on step 2 for a field that lives on step 3, and it must never
// let them reach Review with an invalid earlier step.
// ---------------------------------------------------------------------------

export interface DraftImage {
  /** Object URL for preview. Revoked when the image is removed. */
  url: string;
  name: string;
  size: number;
}

export interface ListingDraft {
  type: ListingType;
  title: string;
  propertyType: PropertyType | "";
  state: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  rentDuration: RentDuration;
  furnishing: FurnishingStatus | "";
  amenities: Amenity[];
  description: string;
  images: DraftImage[];
}

export const EMPTY_DRAFT: ListingDraft = {
  type: "rent",
  title: "",
  propertyType: "",
  state: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  rentDuration: "long-term",
  furnishing: "",
  amenities: [],
  description: "",
  images: [],
};

/** PRD §4: location is a fixed dropdown, never free text, "so results stay
    accurate" — the same list the public search uses. */
export const LISTING_STATES = ["Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Enugu"];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 8;
export const MIN_DESCRIPTION = 40;
export const MIN_TITLE = 8;

export type StepId = "basics" | "details" | "media" | "review";

export const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: "basics", label: "Basics", hint: "What and where" },
  { id: "details", label: "Details", hint: "Price and rooms" },
  { id: "media", label: "Photos", hint: "Images and description" },
  { id: "review", label: "Review", hint: "Check and submit" },
];

export type DraftErrors = Partial<Record<keyof ListingDraft, string>>;

/**
 * Validates only the fields belonging to `step`.
 *
 * Price bounds are deliberately different per intent: a ₦500,000 sale price
 * is almost certainly a typo for a Nigerian property, while ₦500,000 is an
 * entirely ordinary annual rent. One shared numeric rule would either wave
 * through bad sale prices or reject valid rents.
 */
export function validateStep(step: StepId, d: ListingDraft): DraftErrors {
  const e: DraftErrors = {};

  if (step === "basics") {
    if (!d.title.trim()) e.title = "Give your listing a title.";
    else if (d.title.trim().length < MIN_TITLE)
      e.title = `Use at least ${MIN_TITLE} characters so renters know what this is.`;
    if (!d.propertyType) e.propertyType = "Choose the property type.";
    if (!d.state) e.state = "Choose the state this property is in.";
  }

  if (step === "details") {
    const price = Number(d.price);
    if (!d.price.trim()) e.price = "Enter a price.";
    else if (!Number.isFinite(price) || price <= 0) e.price = "Price must be a number greater than zero.";
    else if (d.type === "sale" && price < 1_000_000)
      e.price = "Sale prices are entered in full naira — this looks too low.";
    else if (d.type === "rent" && price < 50_000)
      e.price = "Annual rent is entered in full naira — this looks too low.";

    if (!d.bedrooms) e.bedrooms = "Select the number of bedrooms.";
    if (!d.bathrooms) e.bathrooms = "Select the number of bathrooms.";
  }

  if (step === "media") {
    if (!d.description.trim()) e.description = "Add a description.";
    else if (d.description.trim().length < MIN_DESCRIPTION)
      e.description = `Add at least ${MIN_DESCRIPTION} characters — currently ${d.description.trim().length}.`;
    if (d.images.length === 0) e.images = "Add at least one photo.";
  }

  return e;
}

/** Every step must pass before Review can submit. */
export function validateAll(d: ListingDraft): DraftErrors {
  return {
    ...validateStep("basics", d),
    ...validateStep("details", d),
    ...validateStep("media", d),
  };
}

export function firstInvalidStep(d: ListingDraft): StepId | null {
  const order: StepId[] = ["basics", "details", "media"];
  return order.find((s) => Object.keys(validateStep(s, d)).length > 0) ?? null;
}

/** Rejects a file with a specific reason, or returns null if acceptable. */
export function rejectImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return `${file.name} isn't an image file.`;
  if (file.size > MAX_IMAGE_BYTES)
    return `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 5MB.`;
  return null;
}

export function formatNaira(value: string | number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₦${new Intl.NumberFormat("en-NG").format(n)}`;
}
