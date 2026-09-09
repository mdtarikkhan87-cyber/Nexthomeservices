import {
  Amenity,
  BathroomType,
  ContentItemState,
  FurnishingStatus,
  ListingType,
  OccupancyType,
  PropertyListing,
  PropertyType,
  RentDuration,
  SharedRoom,
} from "./types";
import { request as apiRequest, authedRequest as apiAuthedRequest } from "./backend-client";

// ---------------------------------------------------------------------------
// Naming translation — same reasoning as backend-client.ts's role mapping:
// the backend's Prisma enums can't contain hyphens, so several fields use
// underscores server-side while the frontend keeps its existing hyphenated
// vocabulary. Translated once, here, at the API boundary.
// ---------------------------------------------------------------------------

type BackendRentDuration = "short_term" | "long_term";
type BackendBathroomType = "private_bath" | "shared_bath";
type BackendFurnishingStatus = "furnished" | "semi_furnished" | "unfurnished";
type BackendAmenity =
  | "borehole" | "power_backup" | "gated_security" | "parking"
  | "air_conditioning" | "fitted_kitchen" | "swimming_pool" | "balcony";
type BackendContentItemState = "pending_review" | "live" | "rejected";

const RENT_DURATION_TO_BACKEND: Record<RentDuration, BackendRentDuration> = {
  "short-term": "short_term",
  "long-term": "long_term",
};
const RENT_DURATION_TO_FRONTEND: Record<BackendRentDuration, RentDuration> = {
  short_term: "short-term",
  long_term: "long-term",
};

const BATHROOM_TYPE_TO_BACKEND: Record<BathroomType, BackendBathroomType> = {
  private: "private_bath",
  shared: "shared_bath",
};
const BATHROOM_TYPE_TO_FRONTEND: Record<BackendBathroomType, BathroomType> = {
  private_bath: "private",
  shared_bath: "shared",
};

const FURNISHING_TO_BACKEND: Record<FurnishingStatus, BackendFurnishingStatus> = {
  furnished: "furnished",
  "semi-furnished": "semi_furnished",
  unfurnished: "unfurnished",
};
const FURNISHING_TO_FRONTEND: Record<BackendFurnishingStatus, FurnishingStatus> = {
  furnished: "furnished",
  semi_furnished: "semi-furnished",
  unfurnished: "unfurnished",
};

const AMENITY_TO_BACKEND: Record<Amenity, BackendAmenity> = {
  borehole: "borehole",
  "power-backup": "power_backup",
  "gated-security": "gated_security",
  parking: "parking",
  "air-conditioning": "air_conditioning",
  "fitted-kitchen": "fitted_kitchen",
  "swimming-pool": "swimming_pool",
  balcony: "balcony",
};
const AMENITY_TO_FRONTEND: Record<BackendAmenity, Amenity> = {
  borehole: "borehole",
  power_backup: "power-backup",
  gated_security: "gated-security",
  parking: "parking",
  air_conditioning: "air-conditioning",
  fitted_kitchen: "fitted-kitchen",
  swimming_pool: "swimming-pool",
  balcony: "balcony",
};

const STATUS_TO_FRONTEND: Record<BackendContentItemState, ContentItemState> = {
  pending_review: "pending-review",
  live: "live",
  rejected: "rejected",
};

interface BackendSharedRoom {
  id: string;
  label: string;
  status: "available" | "occupied"; // identical vocabulary both sides
}
interface BackendSharedDetails {
  totalRooms: number;
  bathroomType: BackendBathroomType;
  kitchenShared: boolean;
  maxOccupantsPerRoom: number;
  rentPerRoom: number;
  rooms: BackendSharedRoom[];
}
interface BackendListing {
  id: string;
  landlordId: string;
  type: ListingType; // "rent" | "sale" — identical both sides
  title: string;
  description: string;
  price: number;
  currency: string;
  state: string;
  lga: string | null;
  bedrooms: number;
  bathrooms: number | null;
  rentDuration: BackendRentDuration | null;
  propertyType: PropertyType | null; // identical vocabulary both sides
  furnishing: BackendFurnishingStatus | null;
  amenities: BackendAmenity[];
  photoUrl: string;
  galleryUrls: string[];
  verified: boolean;
  status: BackendContentItemState;
  viewCount: number;
  occupancyType: OccupancyType | null; // identical vocabulary both sides
  shared: BackendSharedDetails | null;
  createdAt: string;
  updatedAt: string;
}

function toFrontendListing(b: BackendListing): PropertyListing {
  return {
    id: b.id,
    landlordId: b.landlordId,
    type: b.type,
    title: b.title,
    price: b.price,
    currency: b.currency as "USD" | "NGN",
    state: b.state,
    lga: b.lga ?? undefined,
    bedrooms: b.bedrooms,
    rentDuration: b.rentDuration ? RENT_DURATION_TO_FRONTEND[b.rentDuration] : undefined,
    propertyType: b.propertyType ?? undefined,
    bathrooms: b.bathrooms ?? undefined,
    furnishing: b.furnishing ? FURNISHING_TO_FRONTEND[b.furnishing] : undefined,
    amenities: b.amenities.map((a) => AMENITY_TO_FRONTEND[a]),
    photoUrl: b.photoUrl,
    galleryUrls: b.galleryUrls,
    verified: b.verified,
    status: STATUS_TO_FRONTEND[b.status],
    viewCount: b.viewCount,
    description: b.description,
    occupancyType: b.occupancyType ?? undefined,
    shared: b.shared
      ? {
          totalRooms: b.shared.totalRooms,
          bathroomType: BATHROOM_TYPE_TO_FRONTEND[b.shared.bathroomType],
          kitchenShared: b.shared.kitchenShared,
          maxOccupantsPerRoom: b.shared.maxOccupantsPerRoom,
          rentPerRoom: b.shared.rentPerRoom,
          rooms: b.shared.rooms.map((r): SharedRoom => ({ id: r.id, label: r.label, status: r.status })),
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Temporary image handling — there is no S3/upload backend yet. This
// converts an in-browser blob: URL (from URL.createObjectURL, used by the
// wizard's image picker) into a base64 data URL so it's an actual string
// that survives being sent to and stored by the API. Works, but is NOT how
// this should work long-term — swap for a real upload endpoint (S3
// presigned URL) later; storing base64 photos in Postgres does not scale.
// ---------------------------------------------------------------------------
export async function objectUrlToDataUrl(objectUrl: string): Promise<string> {
  const blob = await fetch(objectUrl).then((r) => r.blob());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CreateListingInput {
  type: ListingType;
  title: string;
  description: string;
  price: number;
  currency?: string;
  state: string;
  lga?: string;
  bedrooms: number;
  bathrooms?: number;
  rentDuration?: RentDuration;
  propertyType?: PropertyType;
  furnishing?: FurnishingStatus;
  amenities?: Amenity[];
  photoUrl: string;
  galleryUrls?: string[];
  occupancyType?: OccupancyType;
  shared?: {
    totalRooms: number;
    bathroomType: BathroomType;
    kitchenShared: boolean;
    maxOccupantsPerRoom: number;
    rentPerRoom: number;
    rooms: string[]; // room labels, e.g. "Room 1", "Room 2"
  };
}

export async function apiCreateListing(input: CreateListingInput): Promise<PropertyListing> {
  const body = {
    ...input,
    rentDuration: input.rentDuration ? RENT_DURATION_TO_BACKEND[input.rentDuration] : undefined,
    amenities: input.amenities?.map((a) => AMENITY_TO_BACKEND[a]),
    furnishing: input.furnishing ? FURNISHING_TO_BACKEND[input.furnishing] : undefined,
    shared: input.shared
      ? { ...input.shared, bathroomType: BATHROOM_TYPE_TO_BACKEND[input.shared.bathroomType] }
      : undefined,
  };
  const result = await apiAuthedRequest<BackendListing>("/listings", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return toFrontendListing(result);
}

export interface ListingSearchFilters {
  state?: string;
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  rentDuration?: RentDuration;
  page?: number;
  limit?: number;
}

export async function apiSearchListings(
  filters: ListingSearchFilters = {},
): Promise<{ listings: PropertyListing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.type) params.set("type", filters.type);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));
  if (filters.rentDuration) params.set("rentDuration", RENT_DURATION_TO_BACKEND[filters.rentDuration]);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  const result = await apiRequest<{
    listings: BackendListing[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/listings${query ? `?${query}` : ""}`);

  return { listings: result.listings.map(toFrontendListing), pagination: result.pagination };
}

export async function apiFetchListingById(id: string, options: { countView?: boolean } = {}): Promise<PropertyListing> {
  const countView = options.countView ?? true;
  const result = await apiRequest<BackendListing>(`/listings/${id}${countView ? "" : "?count=false"}`);
  return toFrontendListing(result);
}

export async function apiFetchMyListings(): Promise<PropertyListing[]> {
  const result = await apiAuthedRequest<BackendListing[]>("/listings/mine");
  return result.map(toFrontendListing);
}

export async function apiUpdateListing(
  id: string,
  patch: Partial<Pick<CreateListingInput, "title" | "description" | "price" | "bedrooms" | "bathrooms" | "photoUrl" | "galleryUrls">>,
): Promise<PropertyListing> {
  const result = await apiAuthedRequest<BackendListing>(`/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return toFrontendListing(result);
}

export async function apiDeleteListing(id: string): Promise<void> {
  await apiAuthedRequest<void>(`/listings/${id}`, { method: "DELETE" });
}

export async function apiSetRoomStatus(
  listingId: string,
  roomId: string,
  status: "available" | "occupied",
): Promise<BackendSharedRoom> {
  return apiAuthedRequest<BackendSharedRoom>(`/listings/${listingId}/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}