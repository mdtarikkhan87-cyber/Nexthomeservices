import { authedRequest as apiAuthedRequest } from "./backend-client";

export interface Feedback {
  id: string;
  body: string;
  createdAt: string;
}

/** PRD §8.2: feedback is scoped to "any logged-in user" — unlike Complaints,
    there's no anonymous path, so this always sends the caller's token. */
export async function apiSubmitFeedback(body: string): Promise<Feedback> {
  return apiAuthedRequest<Feedback>("/feedback", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
