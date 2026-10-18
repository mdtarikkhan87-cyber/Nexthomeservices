"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { StatusBadge, type StatusKind } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PropertyCard } from "@/components/property/PropertyCard";
import { ListingGridSkeleton, RowListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import {
  AttentionCard,
  Card,
  CardHeader,
  IconTile,
  Initials,
  OverviewHeader,
  PrimaryAction,
  PrimaryLink,
  ROW,
  SecondaryAction,
  StatGrid,
  StatTile,
  type AttentionItem,
  type Tone,
} from "@/components/dashboard/overview-kit";
import {
  IconAlert,
  IconBell,
  IconClock,
  IconEye,
  IconHome,
  IconInbox,
  IconMegaphone,
  IconMessageCircle,
  IconPin,
  IconPlus,
  IconReply,
  IconSearch,
  IconStar,
  IconWrench,
  IconCreditCard,
} from "@/components/ui/icons";
import { useListings } from "@/lib/listings-context";
import { apiSearchListings } from "@/lib/listings-client";
import { apiFetchMyAds } from "@/lib/ads-client";
import { apiFetchMyServiceListings } from "@/lib/services-client";
import { apiFetchConversations, isConversationUnread, otherParticipant, type ConversationSummary } from "@/lib/messaging-client";
import { useLiveEvent } from "@/lib/live-events";
import { formatLocation } from "@/lib/nigeria-locations";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { isShared, unavailableLabel } from "@/lib/shared-property";
import { Advertisement, PropertyListing, RoleName, ServiceListing } from "@/lib/types";

// COMPONENT_ARCHITECTURE.md §4: one shared dashboard frame across all four
// roles; content and sub-nav are role-specific, structure is not.
//
// ROLE-SELECTION REVISION (31 Aug 2026): the role arrives as a PROP, so
// /dashboard/landlord and /dashboard/services render their own role's overview
// whatever the user happened to be acting as a moment ago.
//
// LAYOUT (the dashboard redesign): every overview has the same shape —
//   greeting header with the role's actions
//   stat tiles
//   "Needs attention" (derived from the account's real data)
//   the role's own list(s), with side cards where there is something real to show.
// Data is exactly what each role already read: the landlord's listings
// (listings-context), conversations, ads, service listings and the session's
// notifications — nothing new is fetched or invented. A tile that has not loaded
// shows a skeleton, never a made-up number.

const contextCopy = {
  rent: { title: "Renting", verb: "rent", browseHref: "/listings?mode=rent" as const },
  sale: { title: "Buying", verb: "buy", browseHref: "/listings?mode=sale" as const },
};

export function RoleOverview({ role }: { role: RoleName }) {
  const { user, roles, setTenantBuyerContext } = useAuth();
  const current = roles.find((r) => r.role === role);

  return (
    <div className="flex flex-col gap-6">
      {current?.state === "pending-admin-document-review" && (
        <StatusBanner
          kind="pending"
          title="Your documents are under review"
          description="You can still browse and manage your other active roles while this is pending — nothing else is restricted."
        />
      )}
      {role === "landlord" && <LandlordOverview name={user?.name} subscription={current?.subscriptionState} verified={current?.state === "role-verified"} />}
      {role === "tenant-buyer" && (
        <TenantOverview name={user?.name} context={current?.context ?? "rent"} setContext={setTenantBuyerContext} />
      )}
      {role === "service-provider" && <ProviderOverview name={user?.name} />}
      {role === "advertiser" && <AdvertiserOverview name={user?.name} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const sentence = (n: number) => (n === 0 ? "Everything is up to date." : `${plural(n, "thing")} ${n === 1 ? "needs" : "need"} your attention.`);

/** The signed-in user's conversations, or null until they have loaded. Kept
    current by the event the inbox itself listens for. */
function useConversations(): ConversationSummary[] | null {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const load = useCallback(() => {
    apiFetchConversations()
      .then(setConversations)
      .catch(() => setConversations((prev) => prev ?? []));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useLiveEvent("conversation-updated", load);
  return conversations;
}

/** "Priya, Arjun and Sneha" */
function nameList(names: string[]): string {
  const uniq = [...new Set(names)].slice(0, 3);
  if (uniq.length <= 1) return uniq[0] ?? "";
  return `${uniq.slice(0, -1).join(", ")} and ${uniq[uniq.length - 1]}`;
}

/** One "Needs attention" row for conversations with an unread last message.
    `received` is what the unread messages are: someone's enquiry (landlord,
    provider) or a reply to your own (tenant). */
function unreadItem(
  conversations: ConversationSummary[] | null,
  userId: string | undefined,
  received: "enquiry" | "reply",
  one: string,
  many: string,
): AttentionItem | null {
  if (!conversations || !userId) return null;
  const unread = conversations.filter((c) => isConversationUnread(c, userId));
  if (unread.length === 0) return null;
  const names = nameList(unread.map((c) => otherParticipant(c, userId).name));
  return {
    key: "unread",
    tone: "info",
    icon: <IconMessageCircle className="h-[18px] w-[18px]" />,
    title: plural(unread.length, one, many),
    meta: received === "enquiry" ? `${names} ${unread.length === 1 ? "is" : "are"} waiting for a reply` : `${names} replied to your ${unread.length === 1 ? "message" : "messages"}`,
    cta: received === "enquiry" ? "Reply" : "Open",
    href: "/dashboard/messages",
  };
}

function Thumb({ src, size }: { src?: string; size: 48 | 56 | 64 }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface-dense)]" style={{ width: size, height: size }}>
      {src && <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />}
    </span>
  );
}

function SidePanel({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-6 lg:flex-1 lg:basis-80">{children}</div>;
}

/** Latest notifications of this session (there is no stored feed yet). */
function NotificationsCard() {
  const { notifications } = useNotifications();
  const latest = notifications.slice(0, 4);
  const tone = (s?: StatusKind): Tone => (s === "rejected" ? "rejected" : s === "pending" ? "pending" : "info");
  return (
    <Card labelledBy="ntf-h" className="px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
      <CardHeader id="ntf-h" title="Notifications" href="/dashboard/notifications" padded={false} />
      {latest.length === 0 ? (
        <p className="border-t border-[var(--color-border-hairline)] py-4 text-sm text-[var(--color-text-secondary)]">
          Nothing new. Updates about your account will show up here.
        </p>
      ) : (
        <ul className="mt-1 flex flex-col">
          {latest.map((n) => (
            <li key={n.id} className="flex gap-3 border-t border-[var(--color-border-hairline)] py-3">
              <IconTile tone={tone(n.status)} size={32}>
                <IconBell className="h-4 w-4" />
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13px] font-bold leading-[19px] text-[var(--color-text-primary)]">{n.title}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{n.ago}</span>
              </div>
              {!n.read && <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-blue)]" />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function listingBadge(l: PropertyListing): { kind: StatusKind; label?: string } {
  if (l.status === "rejected") return { kind: "rejected" };
  if (l.status === "pending-review") return { kind: "pending" };
  if (l.isPublished === false) return { kind: "unavailable", label: "Unpublished" };
  const off = unavailableLabel(l);
  if (off) return { kind: "unavailable", label: off };
  return { kind: "live" };
}

function priceParts(l: PropertyListing): { price: string; note: string } {
  const symbol = l.currency === "NGN" ? "₦" : "$";
  const amount = new Intl.NumberFormat("en-NG").format(l.price);
  const note = l.type === "sale" ? "for sale" : isShared(l) ? "per room, per year" : "per year";
  return { price: `${symbol}${amount}`, note };
}

// ---------------------------------------------------------------------------
// Landlord
// ---------------------------------------------------------------------------

function LandlordOverview({ name, subscription, verified }: { name?: string; subscription?: string | null; verified: boolean }) {
  const { user } = useAuth();
  const { myListings, isLoadingMyListings } = useListings();
  const conversations = useConversations();
  const loading = isLoadingMyListings && myListings.length === 0;

  const active = myListings.filter((l) => l.status === "live" && l.isPublished !== false && l.availability !== "rented" && l.availability !== "sold").length;
  const pending = myListings.filter((l) => l.status === "pending-review");
  const rejected = myListings.filter((l) => l.status === "rejected");
  const views = myListings.reduce((sum, l) => sum + l.viewCount, 0);
  const unread = conversations && user ? conversations.filter((c) => isConversationUnread(c, user.id)).length : null;

  const attention = useMemo(() => {
    const items: AttentionItem[] = [];
    const u = unreadItem(conversations, user?.id, "enquiry", "unread message", "unread messages");
    if (u) items.push(u);
    for (const l of pending)
      items.push({
        key: `p-${l.id}`,
        tone: "pending",
        icon: <IconClock className="h-[18px] w-[18px]" />,
        title: `${l.title} is awaiting review`,
        meta: "Our team checks every listing before it goes live.",
        cta: "View",
        href: `/dashboard/listings/${l.id}`,
      });
    for (const l of rejected)
      items.push({
        key: `r-${l.id}`,
        tone: "rejected",
        icon: <IconAlert className="h-[18px] w-[18px]" />,
        title: `${l.title} wasn’t approved`,
        meta: "Open it to see what to change.",
        cta: "View",
        href: `/dashboard/listings/${l.id}`,
      });
    if (verified && subscription === "inactive")
      items.push({
        key: "sub",
        tone: "pending",
        icon: <IconCreditCard className="h-[18px] w-[18px]" />,
        title: "Subscribe to publish listings",
        meta: "There’s no free listing tier — a subscription activates publishing.",
        cta: "View plans",
        href: "/dashboard/subscription",
      });
    return items;
  }, [conversations, user?.id, pending, rejected, verified, subscription]);

  const attentionLoading = loading || conversations === null;
  const shown = myListings.slice(0, 5);
  const subtitle = `${plural(myListings.length, "listing")} · ${active} active`;

  return (
    <>
      <OverviewHeader
        name={name}
        summary={attentionLoading ? null : sentence(attention.length)}
        actions={
          <>
            <PrimaryAction href="/dashboard/listings/new" icon={<IconPlus className="h-[18px] w-[18px]" />}>
              List a property
            </PrimaryAction>
            <SecondaryAction href="/dashboard/messages" icon={<IconMessageCircle className="h-[18px] w-[18px]" />} count={unread ?? 0}>
              Reply to messages
            </SecondaryAction>
            <SecondaryAction href="/dashboard/subscription" icon={<IconCreditCard className="h-[18px] w-[18px]" />}>
              Subscription
            </SecondaryAction>
          </>
        }
      />

      <StatGrid>
        <StatTile label="Active listings" value={loading ? null : active} note="Live and visible to renters" icon={<IconHome className="h-[18px] w-[18px]" />} href="/dashboard/listings" />
        <StatTile label="Awaiting review" value={loading ? null : pending.length} note={pending.length > 0 ? "Admin is checking these" : "Nothing waiting"} icon={<IconClock className="h-[18px] w-[18px]" />} href="/dashboard/listings" />
        <StatTile label="Total views" value={loading ? null : views} note="Across all your listings" icon={<IconEye className="h-[18px] w-[18px]" />} />
        <StatTile label="Unread messages" value={unread} note="Waiting for your reply" icon={<IconInbox className="h-[18px] w-[18px]" />} href="/dashboard/messages" />
      </StatGrid>

      <AttentionCard items={attention} loading={attentionLoading} />

      <Card labelledBy="lst-h">
        <CardHeader id="lst-h" title="My listings" subtitle={loading ? undefined : subtitle} href="/dashboard/listings" linkLabel="View all listings" />
        {loading ? (
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <RowListSkeleton rows={3} />
          </div>
        ) : myListings.length === 0 ? (
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <EmptyState
              title="You haven’t listed a property yet"
              description="List your first property and it will appear here, including while it’s waiting for review."
              action={
                <PrimaryLink href="/dashboard/listings/new">List a property</PrimaryLink>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop: a table. (A tablet is too narrow for its columns, so it uses the cards.) */}
            <div className="hidden lg:block">
              <div className="flex gap-4 border-t border-[var(--color-border-hairline)] bg-[color-mix(in_srgb,var(--color-light-blue)_8%,white)] px-6 py-2 text-xs font-bold text-[var(--color-text-secondary)]">
                <span className="min-w-0 flex-1">Property</span>
                <span className="w-32 shrink-0">Price</span>
                <span className="w-36 shrink-0">Status</span>
                <span className="w-16 shrink-0">Views</span>
                <span className="w-20 shrink-0">
                  <span className="sr-only">Actions</span>
                </span>
              </div>
              <ul>
                {shown.map((l) => {
                  const { price, note } = priceParts(l);
                  const badge = listingBadge(l);
                  return (
                    <li key={l.id} className={`flex items-center gap-4 px-6 py-3 ${ROW}`}>
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <Thumb src={l.photoUrl} size={56} />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <Link href={`/dashboard/listings/${l.id}`} className="truncate text-sm font-bold text-[var(--color-text-primary)] hover:underline">
                            {l.title}
                          </Link>
                          <span className="flex items-center gap-1 text-[13px] text-[var(--color-text-secondary)]">
                            <IconPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{formatLocation(l.state, l.lga)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex w-32 shrink-0 flex-col gap-0.5">
                        <span className="u-numeric text-sm font-bold text-[var(--color-text-primary)]">{price}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{note}</span>
                      </div>
                      <div className="w-36 shrink-0">
                        <StatusBadge kind={badge.kind} label={badge.label} dense />
                      </div>
                      <span className="u-numeric w-16 shrink-0 text-sm font-semibold">{l.viewCount}</span>
                      <div className="w-20 shrink-0">
                        <Link href={`/dashboard/listings/${l.id}`}>
                          <Button variant="secondary" size="dense">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Phones and tablets: one card per listing, as in the mobile design. */}
            <ul className="flex flex-col gap-3 p-4 pt-1 lg:hidden">
              {shown.map((l) => {
                const { price, note } = priceParts(l);
                const badge = listingBadge(l);
                return (
                  <li key={l.id}>
                    <Link
                      href={`/dashboard/listings/${l.id}`}
                      className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-hairline)] p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--color-light-blue)_8%,white)]"
                    >
                      <div className="flex gap-3">
                        <Thumb src={l.photoUrl} size={64} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-[15px] font-bold leading-snug text-[var(--color-text-primary)]">{l.title}</span>
                          <span className="text-[13px] text-[var(--color-text-secondary)]">{formatLocation(l.state, l.lga)}</span>
                          <span className="text-sm font-bold text-[var(--color-text-primary)]">
                            {price} <span className="text-xs font-medium text-[var(--color-text-secondary)]">{note}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-t border-[var(--color-border-hairline)] pt-3 text-[13px] text-[var(--color-text-secondary)]">
                        <StatusBadge kind={badge.kind} label={badge.label} dense />
                        <span>{plural(l.viewCount, "view")}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <EnquiriesCard conversations={conversations} userId={user?.id} className="lg:flex-[2] lg:basis-[34rem]" />
        <SidePanel>
          <Card labelledBy="sub-h" className="gap-5 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h2 id="sub-h" className="text-[13px] font-bold text-[var(--color-text-secondary)]">
                  Subscription
                </h2>
                <p className="text-xl font-bold leading-7 text-[var(--color-text-primary)]">
                  {subscription === "active" ? "Publishing is on" : subscription === "pending_confirmation" ? "Awaiting confirmation" : verified ? "Subscription needed" : "Not available yet"}
                </p>
              </div>
              {subscription === "active" ? <StatusBadge kind="live" label="Active" dense /> : subscription === "pending_confirmation" ? <StatusBadge kind="pending" dense /> : null}
            </div>
            <p className="text-[13px] leading-5 text-[var(--color-text-secondary)]">
              {subscription === "active"
                ? "You can publish listings."
                : verified
                  ? "There’s no free listing tier — subscribe to publish."
                  : "Your account must be verified before you can subscribe."}
            </p>
            <PrimaryLink href="/dashboard/subscription" block>
              {subscription === "active" ? "Manage subscription" : "View plans"}
            </PrimaryLink>
          </Card>
          <NotificationsCard />
        </SidePanel>
      </div>
    </>
  );
}

/** Recent conversations as enquiries: who, about what, the last words. */
function EnquiriesCard({ conversations, userId, className }: { conversations: ConversationSummary[] | null; userId?: string; className?: string }) {
  const unread = conversations && userId ? conversations.filter((c) => isConversationUnread(c, userId)).length : 0;
  const shown = (conversations ?? []).slice(0, 4);
  return (
    <Card labelledBy="enq-h" className={className}>
      <CardHeader
        id="enq-h"
        title="Recent enquiries"
        subtitle={conversations === null ? undefined : unread > 0 ? `${unread} unread` : "All read"}
        href="/dashboard/messages"
      />
      {conversations === null ? (
        <div className="p-4 pt-0 sm:p-6 sm:pt-0">
          <RowListSkeleton rows={3} />
        </div>
      ) : shown.length === 0 ? (
        <p className="border-t border-[var(--color-border-hairline)] px-4 py-6 text-sm text-[var(--color-text-secondary)] sm:px-6">
          No enquiries yet. When someone messages you about a listing, it appears here.
        </p>
      ) : (
        <ul className="pb-2">
          {shown.map((c) => {
            const other = userId ? otherParticipant(c, userId) : { id: "", name: "" };
            const isUnread = userId ? isConversationUnread(c, userId) : false;
            return (
              <li key={c.id} className={`flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 ${ROW}`}>
                <Initials name={other.name} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{other.name}</span>
                    {isUnread && <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-blue)]" />}
                    <span className="ml-auto whitespace-nowrap text-xs text-[var(--color-text-secondary)]">{formatRelativeTime(new Date(c.updatedAt))}</span>
                  </span>
                  <span className="truncate text-xs font-bold text-[var(--color-blue)]">{c.contextTitle}</span>
                  <span className={`truncate text-sm ${isUnread ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                    {c.lastMessageBody ?? "No messages yet"}
                  </span>
                </div>
                <Link
                  href="/dashboard/messages"
                  aria-label={`Reply to ${other.name}`}
                  className="hidden h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-[color-mix(in_srgb,var(--color-deep-blue)_24%,white)] px-3.5 text-[13px] font-bold text-[var(--color-deep-blue)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-light-blue)_12%,white)] sm:flex"
                >
                  <IconReply className="h-[15px] w-[15px]" />
                  Reply
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Advertiser
// ---------------------------------------------------------------------------

function AdvertiserOverview({ name }: { name?: string }) {
  const [ads, setAds] = useState<Advertisement[] | null>(null);
  const load = useCallback(() => {
    apiFetchMyAds()
      .then(setAds)
      .catch(() => setAds((prev) => prev ?? []));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  // An admin approving or rejecting an ad updates this page without a reload.
  useLiveEvent("ad:updated", load);

  const count = (s: Advertisement["status"]) => (ads ? ads.filter((a) => a.status === s).length : null);
  const live = count("live");
  const pending = ads?.filter((a) => a.status === "pending-review") ?? [];
  const rejected = ads?.filter((a) => a.status === "rejected") ?? [];

  const attention: AttentionItem[] = [
    ...rejected.map((a) => ({
      key: `r-${a.id}`,
      tone: "rejected" as Tone,
      icon: <IconAlert className="h-[18px] w-[18px]" />,
      title: `“${a.headline}” wasn’t approved`,
      meta: "Submit an updated ad to try again.",
      cta: "View",
      href: "/dashboard/ads",
    })),
    ...pending.map((a) => ({
      key: `p-${a.id}`,
      tone: "pending" as Tone,
      icon: <IconClock className="h-[18px] w-[18px]" />,
      title: `“${a.headline}” is awaiting review`,
      meta: "It goes live as soon as our team approves it.",
      cta: "View",
      href: "/dashboard/ads",
    })),
  ];
  const summary = ads === null ? null : ads.length === 0 ? "Submit your first ad to start reaching visitors." : `${plural(live ?? 0, "ad")} live. ${sentence(attention.length)}`;

  return (
    <>
      <OverviewHeader
        name={name}
        summary={summary}
        actions={
          <>
            <PrimaryAction href="/dashboard/ads/new" icon={<IconPlus className="h-[18px] w-[18px]" />}>
              Submit a new ad
            </PrimaryAction>
            <SecondaryAction href="/dashboard/ads" icon={<IconMegaphone className="h-[18px] w-[18px]" />}>
              My advertisements
            </SecondaryAction>
          </>
        }
      />

      <StatGrid>
        <StatTile label="Live ads" value={live} note="Showing on the homepage" icon={<IconMegaphone className="h-[18px] w-[18px]" />} href="/dashboard/ads" />
        <StatTile label="Awaiting review" value={count("pending-review")} note="Admin is checking these" icon={<IconClock className="h-[18px] w-[18px]" />} href="/dashboard/ads" />
        <StatTile label="Not approved" value={count("rejected")} icon={<IconAlert className="h-[18px] w-[18px]" />} href="/dashboard/ads" />
        <StatTile label="Total submitted" value={ads ? ads.length : null} icon={<IconInbox className="h-[18px] w-[18px]" />} />
      </StatGrid>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <AttentionCard items={attention} loading={ads === null} className="lg:flex-[2] lg:basis-[34rem]" />
        <SidePanel>
          <NotificationsCard />
        </SidePanel>
      </div>

      <Card labelledBy="ads-h">
        <CardHeader id="ads-h" title="My advertisements" subtitle={ads ? `${plural(ads.length, "ad")} · ${live ?? 0} live` : undefined} href="/dashboard/ads" />
        {ads === null ? (
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <RowListSkeleton rows={3} />
          </div>
        ) : ads.length === 0 ? (
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <EmptyState
              title="No advertisements yet"
              description="Submit your first ad to start reaching NextHome visitors."
              action={
                <PrimaryLink href="/dashboard/ads/new">Submit your first ad</PrimaryLink>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden gap-4 border-t border-[var(--color-border-hairline)] bg-[color-mix(in_srgb,var(--color-light-blue)_8%,white)] px-6 py-2 text-xs font-bold text-[var(--color-text-secondary)] md:flex">
              <span className="min-w-0 flex-1">Advertisement</span>
              <span className="w-40 shrink-0">Links to</span>
              <span className="w-36 shrink-0">Status</span>
            </div>
            <ul>
              {ads.slice(0, 6).map((a) => (
                <li key={a.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 ${ROW}`}>
                  <div className="flex min-w-0 flex-1 basis-60 items-center gap-4">
                    <Thumb src={a.imageUrl} size={56} />
                    <Link href="/dashboard/ads" className="line-clamp-2 text-sm font-bold text-[var(--color-text-primary)] hover:underline">
                      {a.headline}
                    </Link>
                  </div>
                  <span className="w-40 shrink-0 truncate text-[13px] text-[var(--color-text-secondary)]">{hostOf(a.linkUrl)}</span>
                  <div className="w-36 shrink-0">
                    <StatusBadge kind={a.status === "live" ? "live" : a.status === "rejected" ? "rejected" : "pending"} dense />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Service provider
// ---------------------------------------------------------------------------

function ProviderOverview({ name }: { name?: string }) {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceListing[] | null>(null);
  const load = useCallback(() => {
    apiFetchMyServiceListings()
      .then(setServices)
      .catch(() => setServices((prev) => prev ?? []));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useLiveEvent("service:updated", load);

  const conversations = useConversations();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const inquiries = conversations ? conversations.filter((c) => c.contextHref.startsWith("/services/")) : null;
  const unreadCount = inquiries && user ? inquiries.filter((c) => isConversationUnread(c, user.id)).length : null;
  const count = (s: ServiceListing["status"]) => (services ? services.filter((x) => x.status === s).length : null);
  const listing = services?.[0];

  const attention: AttentionItem[] = [];
  const u = unreadItem(inquiries, user?.id, "enquiry", "unread inquiry", "unread inquiries");
  if (u) attention.push(u);
  if (services?.length === 0)
    attention.push({
      key: "create",
      tone: "info",
      icon: <IconWrench className="h-[18px] w-[18px]" />,
      title: "Create your service listing",
      meta: "Customers can’t find you in the directory until you do.",
      cta: "Create",
      href: "/dashboard/service-listing",
    });
  for (const s of services ?? []) {
    if (s.status === "pending-review")
      attention.push({ key: `p-${s.id}`, tone: "pending", icon: <IconClock className="h-[18px] w-[18px]" />, title: `Your ${s.category} listing is awaiting review`, meta: "It appears in the directory once approved.", cta: "View", href: "/dashboard/service-listing" });
    if (s.status === "rejected")
      attention.push({ key: `r-${s.id}`, tone: "rejected", icon: <IconAlert className="h-[18px] w-[18px]" />, title: `Your ${s.category} listing wasn’t approved`, meta: "Update it and submit again.", cta: "View", href: "/dashboard/service-listing" });
  }
  const loadingAttn = services === null || conversations === null;

  const leads = (inquiries ?? []).filter((c) => (tab === "unread" ? !!user && isConversationUnread(c, user.id) : true));

  return (
    <>
      <OverviewHeader
        name={name}
        summary={loadingAttn ? null : sentence(attention.length)}
        actions={
          <>
            <PrimaryAction href="/dashboard/service-listing" icon={listing ? <IconWrench className="h-[18px] w-[18px]" /> : <IconPlus className="h-[18px] w-[18px]" />}>
              {listing ? "Manage my service listing" : "Create your service listing"}
            </PrimaryAction>
            <SecondaryAction href="/dashboard/messages" icon={<IconMessageCircle className="h-[18px] w-[18px]" />} count={unreadCount ?? 0}>
              Respond to inquiries
            </SecondaryAction>
          </>
        }
      />

      <StatGrid>
        <StatTile label="Active service listings" value={count("live")} note="Visible in the directory" icon={<IconWrench className="h-[18px] w-[18px]" />} href="/dashboard/service-listing" />
        <StatTile label="Awaiting review" value={count("pending-review")} note="Admin is checking this" icon={<IconClock className="h-[18px] w-[18px]" />} href="/dashboard/service-listing" />
        <StatTile label="Inquiries" value={inquiries ? inquiries.length : null} note="Customers who messaged you" icon={<IconInbox className="h-[18px] w-[18px]" />} href="/dashboard/messages" />
        <StatTile label="Unread replies" value={unreadCount} icon={<IconMessageCircle className="h-[18px] w-[18px]" />} href="/dashboard/messages" />
      </StatGrid>

      <AttentionCard items={attention} loading={loadingAttn} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card labelledBy="leads-h" className="lg:flex-[2] lg:basis-[34rem]">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-3 sm:p-6 sm:pb-3">
            <div className="flex flex-col gap-1">
              <h2 id="leads-h" className="text-lg font-bold leading-7 sm:text-xl">
                Leads &amp; requests
              </h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">People asking about your services</p>
            </div>
            <div role="tablist" aria-label="Filter inquiries" className="inline-flex rounded-xl bg-[var(--color-surface-dense)] p-1">
              {(["all", "unread"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`min-h-9 rounded-lg px-3 text-[13px] font-bold transition-colors ${tab === t ? "bg-[var(--color-surface-raised)] text-[var(--color-deep-blue)] shadow-[var(--elevation-xs)]" : "text-[var(--color-text-secondary)]"}`}
                >
                  {t === "all" ? "All" : "Unread"}
                </button>
              ))}
            </div>
          </div>
          {inquiries === null ? (
            <div className="p-4 pt-0 sm:p-6 sm:pt-0">
              <RowListSkeleton rows={3} />
            </div>
          ) : leads.length === 0 ? (
            <p className="border-t border-[var(--color-border-hairline)] px-4 py-6 text-sm text-[var(--color-text-secondary)] sm:px-6">
              {tab === "unread" ? "No unread inquiries — you’re all caught up." : "No inquiries yet. When a customer messages you about your service, it appears here."}
            </p>
          ) : (
            <ul>
              {leads.slice(0, 6).map((c) => {
                const other = user ? otherParticipant(c, user.id) : { id: "", name: "" };
                const isUnread = user ? isConversationUnread(c, user.id) : false;
                const awaiting = !!user && c.lastMessageSenderId === user.id;
                return (
                  <li key={c.id} className={`flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 ${ROW}`}>
                    <Initials name={other.name} size={48} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold">{other.name}</span>
                        <StatusBadge kind={isUnread ? "live" : "pending"} label={isUnread ? "New" : awaiting ? "Awaiting reply" : "Read"} dense />
                      </span>
                      <span className="text-[13px] font-semibold text-[var(--color-blue)]">{c.contextTitle}</span>
                      <span className="truncate text-[13px] text-[var(--color-text-secondary)]">
                        {c.lastMessageBody ?? "No messages yet"} · {formatRelativeTime(new Date(c.updatedAt))}
                      </span>
                    </div>
                    <Link href="/dashboard/messages" className="shrink-0">
                      <Button variant="secondary" size="dense">
                        {isUnread ? "Reply" : "Open"}
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <SidePanel>
          <Card labelledBy="svc-h" className="gap-4 p-4 sm:p-6">
            <h2 id="svc-h" className="text-lg font-bold leading-7 sm:text-xl">
              Your service listing
            </h2>
            {services === null ? (
              <Skeleton className="h-20 w-full" />
            ) : !listing ? (
              <>
                <p className="text-sm text-[var(--color-text-secondary)]">You haven’t created one yet. Once it’s approved, customers can find you in the directory and message you.</p>
                <PrimaryLink href="/dashboard/service-listing" block>
                  Create your listing
                </PrimaryLink>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-bold">{listing.category}</span>
                    <span className="text-[13px] text-[var(--color-text-secondary)]">
                      {listing.lgas.length === 0 ? `All of ${listing.state}` : `${listing.state} · ${plural(listing.lgas.length, "area")}`}
                    </span>
                  </div>
                  <StatusBadge kind={listing.status === "live" ? "live" : listing.status === "rejected" ? "rejected" : "pending"} dense />
                </div>
                <Link href="/dashboard/service-listing" className="block">
                  <Button variant="secondary" className="w-full">
                    Manage listing
                  </Button>
                </Link>
              </>
            )}
          </Card>
          <NotificationsCard />
        </SidePanel>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tenant / buyer
// ---------------------------------------------------------------------------

function TenantOverview({
  name,
  context,
  setContext,
}: {
  name?: string;
  context: "rent" | "sale";
  setContext: (c: "rent" | "sale") => void;
}) {
  const { user } = useAuth();
  const { savedListingIds } = useListings();

  // Real listings for the tenant/buyer's current context — fetched here rather
  // than via listings-context.tsx, which only tracks a LANDLORD's own listings
  // (see PropertyBrowser.tsx for the same pattern on the full /listings page).
  const [fetched, setFetched] = useState<{ context: string; listings: PropertyListing[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiSearchListings({ type: context, limit: 50 })
      .then((result) => {
        if (!cancelled) setFetched({ context, listings: result.listings });
      })
      .catch(() => {
        if (!cancelled) setFetched({ context, listings: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [context]);
  const loading = fetched === null || fetched.context !== context;
  const contextListings = loading ? [] : fetched.listings;

  const conversations = useConversations();
  const unread = conversations && user ? conversations.filter((c) => isConversationUnread(c, user.id)).length : null;

  const copy = contextCopy[context];
  const savedCount = contextListings.filter((l) => savedListingIds.has(l.id)).length;
  const recommended = contextListings.filter((l) => !savedListingIds.has(l.id)).slice(0, 3);

  const attention: AttentionItem[] = [];
  const u = unreadItem(conversations, user?.id, "reply", "new reply", "new replies");
  if (u) attention.push(u);
  const summary = conversations === null ? null : unread ? `${plural(unread, "reply", "replies")} waiting for you.` : `Browse homes to ${copy.verb}, or check your saved homes.`;

  return (
    <>
      <OverviewHeader
        name={name}
        summary={summary}
        actions={
          <>
            {/* Renting/Buying context — a context on the single Tenant/Buyer
                role, not a separate role (ROLE_EXPERIENCE_AUDIT.md §4 Option C). */}
            <div role="group" aria-label="Renting or buying" className="inline-flex h-11 shrink-0 items-center rounded-xl bg-[var(--color-surface-dense)] p-1">
              {(["rent", "sale"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContext(c)}
                  aria-pressed={context === c}
                  className={`h-9 rounded-lg px-3 text-sm font-bold transition-colors ${context === c ? "bg-[var(--color-deep-blue)] text-white" : "text-[var(--color-text-secondary)]"}`}
                >
                  {contextCopy[c].title}
                </button>
              ))}
            </div>
            <PrimaryAction href={copy.browseHref} icon={<IconSearch className="h-[18px] w-[18px]" />}>
              Search homes
            </PrimaryAction>
            <SecondaryAction href="/dashboard/saved" icon={<IconStar className="h-[18px] w-[18px]" />}>
              Saved homes
            </SecondaryAction>
          </>
        }
      />

      <StatGrid>
        <StatTile label={`Saved ${copy.title.toLowerCase()}`} value={loading ? null : savedCount} note={savedCount === 0 ? "Tap the star on a listing" : undefined} icon={<IconStar className="h-[18px] w-[18px]" />} href="/dashboard/saved" />
        <StatTile label={`Live listings to ${copy.verb}`} value={loading ? null : contextListings.length} icon={<IconHome className="h-[18px] w-[18px]" />} href={copy.browseHref} />
        <StatTile label="Enquiries sent" value={conversations ? conversations.length : null} icon={<IconInbox className="h-[18px] w-[18px]" />} href="/dashboard/messages" />
        <StatTile label="Unread messages" value={unread} icon={<IconMessageCircle className="h-[18px] w-[18px]" />} href="/dashboard/messages" />
      </StatGrid>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <Card labelledBy="match-h" className="lg:flex-[2] lg:basis-[34rem]">
          <CardHeader id="match-h" title={`Picked for ${copy.title.toLowerCase()}`} subtitle="Live listings you haven’t saved yet" href={copy.browseHref} linkLabel="See all" />
          <div className="p-4 pt-1 sm:p-6 sm:pt-1">
            {loading ? (
              <ListingGridSkeleton count={3} className="lg:grid-cols-3" />
            ) : recommended.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recommended.map((l) => (
                  <PropertyCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={contextListings.length === 0 ? `No homes to ${copy.verb} right now` : "You’ve saved everything on offer"}
                description={contextListings.length === 0 ? "New listings appear here as soon as they pass review. Check back soon." : "Every live listing is already in your saved homes. New ones will show up here."}
                action={
                  <Link href="/dashboard/saved">
                    <Button size="dense" variant="secondary">
                      View saved homes
                    </Button>
                  </Link>
                }
              />
            )}
          </div>
        </Card>
        <SidePanel>
          <AttentionCard items={attention} loading={conversations === null} />
          <NotificationsCard />
        </SidePanel>
      </div>

      <Card labelledBy="sent-h">
        <CardHeader id="sent-h" title="Enquiries sent" subtitle={conversations ? `${plural(conversations.length, "conversation")}` : undefined} href="/dashboard/messages" />
        {conversations === null ? (
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <RowListSkeleton rows={3} />
          </div>
        ) : conversations.length === 0 ? (
          <p className="border-t border-[var(--color-border-hairline)] px-4 py-6 text-sm text-[var(--color-text-secondary)] sm:px-6">
            You haven’t contacted anyone yet. Open a listing and send a message to start a conversation.
          </p>
        ) : (
          <ul>
            {conversations.slice(0, 5).map((c) => {
              const isUnread = user ? isConversationUnread(c, user.id) : false;
              const awaiting = !!user && c.lastMessageSenderId === user.id;
              return (
                <li key={c.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 ${ROW}`}>
                  <IconTile tone="info" size={40}>
                    <IconHome className="h-5 w-5" />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                    <Link href={c.contextHref} className="truncate text-sm font-bold text-[var(--color-text-primary)] hover:underline">
                      {c.contextTitle}
                    </Link>
                    <span className="text-[13px] text-[var(--color-text-secondary)]">{user ? otherParticipant(c, user.id).name : ""}</span>
                  </div>
                  <span className="w-28 shrink-0 text-[13px] text-[var(--color-text-secondary)]">{formatRelativeTime(new Date(c.updatedAt))}</span>
                  <div className="w-32 shrink-0">
                    <StatusBadge kind={isUnread ? "live" : "pending"} label={isUnread ? "New reply" : awaiting ? "Awaiting reply" : "Read"} dense />
                  </div>
                  <Link href="/dashboard/messages" className="shrink-0">
                    <Button variant="secondary" size="dense">
                      View chat
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
