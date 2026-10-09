import { RoleName } from "./types";
import { StatusKind } from "@/components/ui/StatusBadge";

// ---------------------------------------------------------------------------
// Notification vocabulary.
//
// Notifications are NOT backed by the server yet: there is no
// `GET /notifications`, so the feed starts empty and only holds events raised
// in the current browser session by the user's own actions (see `notify` in
// notification-context.tsx) — they are not persisted and are lost on reload.
// Real notifications driven by backend events (enquiries, approvals, ...) are
// a planned feature (IMPLEMENTATION_NOTES.md #13). The shape below is what
// such an endpoint would return, so adding it is a change to
// notification-context.tsx alone.
//
// EVENT SCOPE — every notification below corresponds to a state transition
// the product ALREADY models (PRODUCT_DECISIONS.md §6):
//   ContentItemState   pending-review → live | rejected   (listings/services/ads)
//   RoleState          role-added → pending-admin-document-review → role-verified
//   SubscriptionState  inactive → pending-confirmation → active
//   plus on-platform messaging (PRD §6.4)
//
// Deliberately NOT modelled: property visits / booking updates. No booking
// system exists — PRODUCT_UNDERSTANDING.md §203 records Short-/Long-Term as
// "a filter tag only — not a separate booking system… a booking calendar
// would be a separately scoped addition". Inventing those events would mean
// inventing the subsystem behind them.
// ---------------------------------------------------------------------------

export type NotificationKind =
  | "enquiry" // someone messaged you about a listing / service
  | "content-status" // a listing, service listing or ad changed state
  | "account" // account- or role-level verification update
  | "subscription"; // landlord subscription state

export interface AppNotification {
  id: string;
  /** Which role's feed this belongs to. A user holding several roles sees
      the feed for whichever role is active, matching how the dashboard
      already scopes everything else. */
  role: RoleName;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Deep link to the screen that resolves the notification. */
  href?: string;
  /** Reuses the shared StatusBadge vocabulary so a "Live"/"Rejected"
      notification reads identically to the badge on the item itself
      (DESIGN_SYSTEM.md §7: one state, one label, everywhere). */
  status?: StatusKind;
  /**
   * Pre-formatted relative time rather than a timestamp.
   *
   * Deliberate: a Date.now() computed while rendering would produce one value
   * during SSR and a different one on hydration, which React reports as a
   * mismatch. Session notifications are stamped "Just now" when raised.
   */
  ago: string;
  read: boolean;
}

export const KIND_LABELS: Record<NotificationKind, string> = {
  enquiry: "Enquiry",
  "content-status": "Listing status",
  account: "Account",
  subscription: "Subscription",
};
