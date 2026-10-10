import { ContentItemState, ServiceListing } from "./types";
import { request as apiRequest, authedRequest as apiAuthedRequest } from "./backend-client";

// Same translation reasoning as listings-client.ts: Prisma enums can't use
// hyphens, so ContentItemState is underscored server-side.
type BackendContentItemState = "pending_review" | "live" | "rejected";
const STATUS_TO_FRONTEND: Record<BackendContentItemState, ContentItemState> = {
  pending_review: "pending-review",
  live: "live",
  rejected: "rejected",
};

interface BackendServiceListing {
  id: string;
  providerId: string;
  category: string;
  description: string;
  state: string;
  lgas: string[];
  photoUrl: string | null;
  verified: boolean;
  status: BackendContentItemState;
  createdAt: string;
  updatedAt: string;
  // Only present on routes that include the provider relation
  // (GET /services and GET /services/:id) — absent on /services/mine,
  // where the provider is always the caller themself.
  provider?: { id: string; name: string };
}

function toFrontendService(b: BackendServiceListing): ServiceListing {
  return {
    id: b.id,
    providerId: b.providerId,
    category: b.category,
    providerName: b.provider?.name ?? "",
    description: b.description,
    state: b.state,
    lgas: b.lgas,
    photoUrl: b.photoUrl ?? undefined,
    verified: b.verified,
    status: STATUS_TO_FRONTEND[b.status],
  };
}

export interface CreateServiceListingInput {
  category: string;
  description: string;
  state: string;
  lgas?: string[];
  photoUrl?: string;
}

export async function apiCreateServiceListing(input: CreateServiceListingInput): Promise<ServiceListing> {
  const result = await apiAuthedRequest<BackendServiceListing>("/services", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toFrontendService(result);
}

export interface ServiceSearchFilters {
  state?: string;
  category?: string;
  lga?: string;
  page?: number;
  limit?: number;
}

export async function apiSearchServices(
  filters: ServiceSearchFilters = {},
): Promise<{ services: ServiceListing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.category) params.set("category", filters.category);
  if (filters.lga) params.set("lga", filters.lga);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  const result = await apiRequest<{
    services: BackendServiceListing[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/services${query ? `?${query}` : ""}`);

  return { services: result.services.map(toFrontendService), pagination: result.pagination };
}

export async function apiFetchServiceById(id: string): Promise<ServiceListing> {
  const result = await apiRequest<BackendServiceListing>(`/services/${id}`);
  return toFrontendService(result);
}

/** The authenticated provider's own listing(s), any status. */
export async function apiFetchMyServiceListings(): Promise<ServiceListing[]> {
  const result = await apiAuthedRequest<BackendServiceListing[]>("/services/mine");
  return result.map(toFrontendService);
}

export async function apiUpdateServiceListing(
  id: string,
  patch: Partial<CreateServiceListingInput>,
): Promise<ServiceListing> {
  const result = await apiAuthedRequest<BackendServiceListing>(`/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return toFrontendService(result);
}

export async function apiDeleteServiceListing(id: string): Promise<void> {
  await apiAuthedRequest<void>(`/services/${id}`, { method: "DELETE" });
}
