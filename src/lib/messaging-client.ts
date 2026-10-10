import { authedRequest as apiAuthedRequest } from "./backend-client";

export interface ConversationSummary {
  id: string;
  participantAId: string;
  participantAName: string;
  participantBId: string;
  participantBName: string;
  /** Human label for what this conversation is about — a listing title or
      a service category — and where to view it. */
  contextTitle: string;
  contextHref: string;
  lastMessageBody?: string;
  lastMessageSenderId?: string;
  lastMessageReadAt?: string | null;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface BackendParticipant {
  id: string;
  name: string;
}

interface BackendMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface BackendConversation {
  id: string;
  listingId: string | null;
  serviceListingId: string | null;
  participantA: BackendParticipant;
  participantB: BackendParticipant;
  listing: { id: string; title: string } | null;
  serviceListing: { id: string; category: string } | null;
  messages: BackendMessage[]; // just the most recent, per GET /conversations
  updatedAt: string;
}

function toConversationSummary(b: BackendConversation): ConversationSummary {
  const last = b.messages[0];
  const context = b.listing
    ? { title: b.listing.title, href: `/listing/${b.listing.id}` }
    : { title: b.serviceListing!.category, href: `/services/${b.serviceListing!.id}` };

  return {
    id: b.id,
    participantAId: b.participantA.id,
    participantAName: b.participantA.name,
    participantBId: b.participantB.id,
    participantBName: b.participantB.name,
    contextTitle: context.title,
    contextHref: context.href,
    lastMessageBody: last?.body,
    lastMessageSenderId: last?.senderId,
    lastMessageReadAt: last?.readAt ?? null,
    updatedAt: b.updatedAt,
  };
}

/** Starts a conversation about a listing or service, or returns the
    existing one for that pair/context — matches POST /conversations'
    find-or-create behavior. Pass exactly one of listingId/serviceListingId. */
export async function apiStartConversation(
  context: { listingId: string } | { serviceListingId: string },
): Promise<{ id: string }> {
  return apiAuthedRequest<{ id: string }>("/conversations", {
    method: "POST",
    body: JSON.stringify(context),
  });
}

export async function apiFetchConversations(): Promise<ConversationSummary[]> {
  const result = await apiAuthedRequest<BackendConversation[]>("/conversations");
  return result.map(toConversationSummary);
}

export async function apiFetchMessages(conversationId: string): Promise<Message[]> {
  return apiAuthedRequest<Message[]>(`/conversations/${conversationId}/messages`);
}

export async function apiSendMessage(conversationId: string, body: string): Promise<Message> {
  return apiAuthedRequest<Message>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function apiMarkConversationRead(conversationId: string): Promise<void> {
  await apiAuthedRequest(`/conversations/${conversationId}/read`, { method: "PATCH" });
}
