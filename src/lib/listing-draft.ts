import {
  Amenity,
  BathroomType,
  FurnishingStatus,
  ListingType,
  OccupancyType,
  PropertyType,
  RentDuration,
} from "./types";
import { NIGERIAN_STATES, isLgaInState } from "./nigeria-locations";

// ---------------------------------------------------------------------------
// The listing draft: its shape, its validation rules, and the mapping from a
// completed draft to a PropertyListing.
//
// Kept out of the page component so the rules are readable in one place and
// each wizard step can validate only its own fields — the wizard must never
// block someone on step 2 for a field that lives on step 3, and it must never
// let them reach Review with an invalid earlier step.
//
// CLIENT AND SERVER RULES ARE THE SAME RULES. There is no backend in this
// project (no API routes, no server actions), so there is no second place for
// validation to live — and that is exactly the property worth preserving:
// these are pure functions over a plain object with no React or DOM
// dependency, so when a route handler exists it imports validateAll() from
// here rather than restating the rules. Client and server cannot disagree
// because there is only one copy.
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
  /** Whole unit, or room by room. Rentals only — see validateStep. */
  occupancyType: OccupancyType;
  /** Shared only. Kept as strings like every other numeric draft field, so
      the input stays controlled and empty is distinguishable from zero. */
  totalRooms: string;
  bathroomType: BathroomType | "";
  kitchenShared: boolean;
  maxOccupantsPerRoom: string;
  state: string;
  /** LGA within `state`. Required — it is what makes a listing findable by
      someone searching their own area rather than the whole state. */
  lga: string;
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
  // "entire" is the default everywhere: the field is optional on the model,
  // absent means entire, and the wizard starts on the form that already
  // existed. Choosing "shared" is the deliberate act, never the accident.
  occupancyType: "entire",
  totalRooms: "",
  bathroomType: "",
  kitchenShared: false,
  maxOccupantsPerRoom: "",
  state: "",
  lga: "",
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
    accurate" — and it is literally the same list the public search reads, so
    a published listing can always be reached by the filter that matches it. */
export const LISTING_STATES = NIGERIAN_STATES;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 8;
export const MIN_DESCRIPTION = 40;
export const MIN_TITLE = 8;

/** Bounds on a shared let. Not arbitrary: past these the listing is a hostel
    or a hotel, which is a different product with different licensing, and a
    typo ("40" for "4") should be caught rather than published. */
export const MAX_ROOMS = 20;
export const MAX_OCCUPANTS_PER_ROOM = 6;

/**
 * Shared is a RENTAL arrangement, so a sale draft is never shared however the
 * field happens to be set. One predicate owns that rule, and both the
 * validator and the wizard read it — which is what stops a draft that was
 * switched from rent to sale from carrying a stale shared configuration into
 * a published sale listing.
 */
export function isSharedDraft(d: ListingDraft): boolean {
  return d.type === "rent" && d.occupancyType === "shared";
}

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
    // Belt and braces against a draft edited out of order: the wizard only
    // offers the shared option on a rent listing and resets it when the
    // intent changes, so reaching this is a bug rather than a user error —
    // but it is the one combination that must never be published.
    if (d.type === "sale" && d.occupancyType === "shared")
      e.occupancyType = "Shared properties are for rentals only — switch the intent to For Rent.";
    if (!d.state) e.state = "Choose the state this property is in.";
    if (!d.lga) e.lga = "Choose the Local Government Area.";
    // Guards the case where the state was changed after an LGA was picked and
    // the pair was left inconsistent — publishing that would put the listing
    // somewhere no search can find it.
    else if (d.state && !isLgaInState(d.state, d.lga))
      e.lga = `That LGA isn't in ${d.state} — choose one from the list.`;
  }

  if (step === "details") {
    const shared = isSharedDraft(d);
    const price = Number(d.price);
    // On a shared listing this one field IS the rent per room — it is asked
    // once, under a per-room label, and written to both `price` (so the
    // existing price filter and cards keep working on the number a renter
    // actually pays) and `shared.rentPerRoom`.
    if (!d.price.trim()) e.price = shared ? "Enter the rent for one room." : "Enter a price.";
    else if (!Number.isFinite(price) || price <= 0) e.price = "Price must be a number greater than zero.";
    else if (d.type === "sale" && price < 1_000_000)
      e.price = "Sale prices are entered in full naira — this looks too low.";
    else if (d.type === "rent" && price < 50_000)
      e.price = shared
        ? "Annual rent per room is entered in full naira — this looks too low."
        : "Annual rent is entered in full naira — this looks too low.";

    // Bedrooms is not asked on a shared listing: the room count IS the
    // bedroom count, and asking twice invites the two to disagree. It is
    // derived from totalRooms on submit so the bedrooms filter still works.
    if (!shared && !d.bedrooms) e.bedrooms = "Select the number of bedrooms.";
    if (!d.bathrooms) e.bathrooms = "Select the number of bathrooms.";

    if (shared) {
      const rooms = Number(d.totalRooms);
      if (!d.totalRooms.trim()) e.totalRooms = "How many rooms are you letting?";
      else if (!Number.isInteger(rooms) || rooms < 1)
        e.totalRooms = "Enter a whole number of rooms, at least 1.";
      else if (rooms > MAX_ROOMS)
        e.totalRooms = `${MAX_ROOMS} rooms is the maximum for a shared listing.`;

      if (!d.bathroomType) e.bathroomType = "Say whether each room has its own bathroom.";

      const occupants = Number(d.maxOccupantsPerRoom);
      if (!d.maxOccupantsPerRoom.trim())
        e.maxOccupantsPerRoom = "Set how many people may share one room.";
      else if (!Number.isInteger(occupants) || occupants < 1)
        e.maxOccupantsPerRoom = "Enter a whole number, at least 1.";
      else if (occupants > MAX_OCCUPANTS_PER_ROOM)
        e.maxOccupantsPerRoom = `${MAX_OCCUPANTS_PER_ROOM} per room is the maximum.`;
    }
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
