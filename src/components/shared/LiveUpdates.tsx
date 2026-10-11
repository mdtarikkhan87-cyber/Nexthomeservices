"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useListings } from "@/lib/listings-context";
import { useNotifications } from "@/lib/notification-context";
import { toFrontendRoleName, toFrontendRoleState, toFrontendSubscriptionState } from "@/lib/backend-client";
import {
  useLiveEvent,
  useOnSocketConnect,
  type AccountUpdatedEvent,
  type AdUpdatedEvent,
  type ListingRemovedEvent,
  type ListingUpdatedEvent,
  type RoleUpdatedEvent,
  type SavedListingUpdatedEvent,
  type ServiceUpdatedEvent,
} from "@/lib/live-events";
import { ROLE_LABELS } from "@/lib/roles";
import type { ContentItemState, RoleName } from "@/lib/types";

// Renders nothing. Mounted once (providers.tsx) inside the auth, listings and
// notification providers, it turns what the server pushes over the existing
// Socket.IO connection into patches of the app's own state — so a change an
// admin (or another tab) makes shows up on screen without a refresh.
//
// Pages that keep their own local copy of a record (a single listing, the
// admin queues, the service/ad lists) subscribe themselves with useLiveEvent;
// everything held in a shared context is handled here.

const STATUS_TO_FRONTEND: Record<ListingUpdatedEvent["status"], ContentItemState> = {
  pending_review: "pending-review",
  live: "live",
  rejected: "rejected",
};

export function LiveUpdates() {
  const { roles, refreshUser, applyRoleUpdate, applyUserPatch } = useAuth();
  const { patchMyListing, removeMyListing, refetchMyListings, refetchSavedListings } = useListings();
  const { notify } = useNotifications();

  // Whether a role is currently held, read at event time without making the
  // handlers below change identity every time roles change.
  const rolesRef = useRef(roles);
  useEffect(() => {
    rolesRef.current = roles;
  }, [roles]);

  // --- roles: the "documents under review" banner, subscription state -------
  useLiveEvent<RoleUpdatedEvent>("role:updated", (e) => {
    const role = toFrontendRoleName(e.role);
    if (!role) return;

    if (rolesRef.current.some((r) => r.role === role)) {
      applyRoleUpdate(role, {
        state: toFrontendRoleState(e.state),
        subscriptionState: toFrontendSubscriptionState(e.subscriptionState),
      });
    } else {
      // A role we don't know about yet (added in another tab): get the full picture.
      void refreshUser();
    }

    if (e.actor !== "admin") return; // only news from someone else is news
    const label = ROLE_LABELS[role];
    if (e.state === "role_verified") {
      notify({ role, kind: "account", title: "Verification approved", body: `Your ${label} documents were approved.`, href: "/account", status: "verified" });
    } else if (e.state === "role_added" && !e.hasDocument) {
      notify({ role, kind: "account", title: "Documents not approved", body: `Your ${label} documents weren't approved. Please upload them again.`, href: "/account", status: "rejected" });
    } else if (role === "landlord" && e.subscriptionState === "active") {
      notify({ role, kind: "subscription", title: "Subscription activated", body: "Your landlord subscription is active — you can publish listings.", href: "/dashboard/subscription", status: "success" });
    } else if (role === "landlord" && e.subscriptionState === "inactive") {
      notify({ role, kind: "subscription", title: "Subscription deactivated", body: "Your landlord subscription is no longer active.", href: "/dashboard/subscription", status: "pending" });
    }
  });

  // --- the account itself ----------------------------------------------------
  useLiveEvent<AccountUpdatedEvent>("account:updated", (e) => {
    applyUserPatch({
      ...(e.name !== undefined && { name: e.name }),
      ...(e.phone !== undefined && { phone: e.phone ?? undefined }),
      ...(e.phoneVerified !== undefined && { phoneVerified: e.phoneVerified }),
      ...(e.emailVerified !== undefined && { emailVerified: e.emailVerified }),
    });
  });

  // --- the landlord's own listings -------------------------------------------
  useLiveEvent<ListingUpdatedEvent>("listing:updated", (e) => {
    const known = patchMyListing(e.id, {
      title: e.title,
      status: STATUS_TO_FRONTEND[e.status],
      availability: e.availability,
      isPublished: e.isPublished,
      verified: e.verified,
    });
    if (!known) refetchMyListings().catch(() => {}); // e.g. created in another tab

    if (e.actor !== "admin") return;
    if (e.status === "live") {
      notify({ role: "landlord", kind: "content-status", title: "Listing approved", body: `“${e.title}” passed review and is now live.`, href: `/dashboard/listings/${e.id}`, status: "live" });
    } else if (e.status === "rejected") {
      notify({ role: "landlord", kind: "content-status", title: "Listing not approved", body: `“${e.title}” wasn't approved.`, href: `/dashboard/listings/${e.id}`, status: "rejected" });
    }
  });

  useLiveEvent<ListingRemovedEvent>("listing:removed", (e) => removeMyListing(e.id));

  // Someone's change to a listing this user saved (e.g. unpublished): the
  // server decides what their Saved list may show, so ask it again.
  useLiveEvent<SavedListingUpdatedEvent>("saved-listing:updated", () => {
    refetchSavedListings().catch(() => {});
  });

  // --- services and ads: the data lives in their pages, which refetch on these
  //     same events; only the notification is raised here ---------------------
  useLiveEvent<ServiceUpdatedEvent>("service:updated", (e) => {
    if (e.actor !== "admin" || !e.status) return;
    notify({ role: "service-provider" as RoleName, kind: "content-status", title: e.status === "live" ? "Service listing approved" : "Service listing not approved", body: `Your ${e.category ?? "service"} listing ${e.status === "live" ? "is now live" : "wasn't approved"}.`, href: "/dashboard/service-listing", status: e.status === "live" ? "live" : "rejected" });
  });
  useLiveEvent<AdUpdatedEvent>("ad:updated", (e) => {
    if (e.actor !== "admin" || !e.status) return;
    notify({ role: "advertiser", kind: "content-status", title: e.status === "live" ? "Advertisement approved" : "Advertisement not approved", body: `“${e.headline ?? "Your ad"}” ${e.status === "live" ? "is now live" : "wasn't approved"}.`, href: "/dashboard/ads", status: e.status === "live" ? "live" : "rejected" });
  });

  // --- resync -----------------------------------------------------------------
  // Events are not replayed. Whatever happened while the connection was down —
  // or between this page's first fetch and its socket connecting — is picked up
  // here by re-reading from the server.
  useOnSocketConnect(() => {
    void refreshUser();
    refetchMyListings().catch(() => {});
    refetchSavedListings().catch(() => {});
  });

  return null;
}
