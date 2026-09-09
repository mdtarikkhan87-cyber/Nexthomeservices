import { request as apiRequest, authedRequest as apiAuthedRequest } from "./backend-client";
import { getAccessToken } from "./token-storage";

// Backend statuses ("open" | "in_review" | "resolved") aren't surfaced to
// the submitter anywhere yet — no UI reads a complaint's status today —
// so there is nothing to translate here, unlike ContentItemState elsewhere.

export interface Complaint {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
}

interface BackendComplaint {
  id: string;
  userId: string | null;
  subject: string;
  body: string;
  status: "open" | "in_review" | "resolved";
  createdAt: string;
  updatedAt: string;
}

function toFrontendComplaint(b: BackendComplaint): Complaint {
  return { id: b.id, subject: b.subject, body: b.body, createdAt: b.createdAt };
}

export interface SubmitComplaintInput {
  subject: string;
  body: string;
}

/**
 * Open to anyone — linked to an account only if the caller happens to be
 * logged in (matches the backend's optionalAuthenticate: a valid token
 * attaches the complaint to that user, no token submits it anonymously).
 * Not routed through authedRequest, since that throws when there's no
 * token; a guest submitting a complaint is the expected case, not an error.
 */
export async function apiSubmitComplaint(input: SubmitComplaintInput): Promise<Complaint> {
  const accessToken = getAccessToken();
  const result = await apiRequest<BackendComplaint>("/complaints", {
    method: "POST",
    body: JSON.stringify(input),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return toFrontendComplaint(result);
}

/** Complaints the authenticated user has filed. Real auth required — an
    anonymous submission was never linked to any account to look up. */
export async function apiFetchMyComplaints(): Promise<Complaint[]> {
  const result = await apiAuthedRequest<BackendComplaint[]>("/complaints/mine");
  return result.map(toFrontendComplaint);
}
