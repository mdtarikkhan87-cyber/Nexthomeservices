import { request as apiRequest, authedRequest as apiAuthedRequest } from "./backend-client";

export interface Rating {
  id: string;
  raterId: string;
  raterName: string;
  rateeId: string;
  score: number;
  comment?: string;
  createdAt: string;
}

interface BackendRating {
  id: string;
  raterId: string;
  rateeId: string;
  score: number;
  comment: string | null;
  createdAt: string;
  rater?: { id: string; name: string };
}

function toFrontendRating(b: BackendRating): Rating {
  return {
    id: b.id,
    raterId: b.raterId,
    raterName: b.rater?.name ?? "",
    rateeId: b.rateeId,
    score: b.score,
    comment: b.comment ?? undefined,
    createdAt: b.createdAt,
  };
}

/** Every rating a given user has received, newest first. Public — no auth. */
export async function apiFetchRatingsForUser(userId: string): Promise<Rating[]> {
  const result = await apiRequest<BackendRating[]>(`/ratings/user/${userId}`);
  return result.map(toFrontendRating);
}

export interface SubmitRatingInput {
  rateeId: string;
  score: number;
  comment?: string;
}

export async function apiSubmitRating(input: SubmitRatingInput): Promise<Rating> {
  const result = await apiAuthedRequest<BackendRating>("/ratings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toFrontendRating(result);
}

/** Ratings the authenticated user has given. */
export async function apiFetchRatingsIGave(): Promise<Rating[]> {
  const result = await apiAuthedRequest<BackendRating[]>("/ratings/mine-given");
  return result.map(toFrontendRating);
}
