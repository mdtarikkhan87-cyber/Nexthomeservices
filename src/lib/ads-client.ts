import { Advertisement, ContentItemState } from "./types";
import { request as apiRequest, authedRequest as apiAuthedRequest } from "./backend-client";

// Same translation reasoning as listings-client.ts: Prisma enums can't use
// hyphens, so ContentItemState is underscored server-side.
type BackendContentItemState = "pending_review" | "live" | "rejected";
const STATUS_TO_FRONTEND: Record<BackendContentItemState, ContentItemState> = {
  pending_review: "pending-review",
  live: "live",
  rejected: "rejected",
};

interface BackendAdvertisement {
  id: string;
  advertiserId: string;
  imageUrl: string;
  headline: string;
  linkUrl: string;
  placement: string | null;
  status: BackendContentItemState;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function toFrontendAd(b: BackendAdvertisement): Advertisement {
  return {
    id: b.id,
    imageUrl: b.imageUrl,
    headline: b.headline,
    linkUrl: b.linkUrl,
    placement: b.placement ?? undefined,
    status: STATUS_TO_FRONTEND[b.status],
  };
}

export interface CreateAdvertisementInput {
  imageUrl: string;
  headline: string;
  linkUrl: string;
}

export async function apiCreateAdvertisement(input: CreateAdvertisementInput): Promise<Advertisement> {
  const result = await apiAuthedRequest<BackendAdvertisement>("/ads", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toFrontendAd(result);
}

export async function apiSearchAds(
  filters: { placement?: string; page?: number; limit?: number } = {},
): Promise<{ ads: Advertisement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (filters.placement) params.set("placement", filters.placement);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  const result = await apiRequest<{
    ads: BackendAdvertisement[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/ads${query ? `?${query}` : ""}`);

  return { ads: result.ads.map(toFrontendAd), pagination: result.pagination };
}

/** The authenticated advertiser's own ads, any status. */
export async function apiFetchMyAds(): Promise<Advertisement[]> {
  const result = await apiAuthedRequest<BackendAdvertisement[]>("/ads/mine");
  return result.map(toFrontendAd);
}

export async function apiUpdateAdvertisement(
  id: string,
  patch: Partial<CreateAdvertisementInput>,
): Promise<Advertisement> {
  const result = await apiAuthedRequest<BackendAdvertisement>(`/ads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return toFrontendAd(result);
}

export async function apiDeleteAdvertisement(id: string): Promise<void> {
  await apiAuthedRequest<void>(`/ads/${id}`, { method: "DELETE" });
}
