# Implementation Notes — Tracked Open Items

These are **not resolved**. Each is a placeholder or a deliberately conservative default, not a product decision. Do not treat any of the code referenced below as final — resolve the underlying product question first (see PRODUCT_DECISIONS.md / SCREEN_BLUEPRINTS.md / USER_JOURNEYS.md Readiness Checks), then update the referenced code.

| # | Item | Where it lives in code | Current placeholder behavior |
|---|---|---|---|
| 1 | Status color extension for rejected states | `src/app/globals.css` (`--color-status-rejected`) | A non-brand muted terracotta, chosen for legibility, pending sign-off from whoever owns the Brand Guidelines |
| 2 | Admin journey-level design | Not implemented at all | No `/admin` routes exist in this pass — PRD §6.8 requirements were never given journey-level detail upstream |
| 3 | Complaints form access model | `src/app/(public)/complaints/page.tsx` | Left open/unauthenticated as a conservative default; explicitly commented in the file as unresolved |
| 4 | Exact messaging verification gate | `src/components/property/ListingActions.tsx`, `ServiceContactAction.tsx`, `src/app/dashboard/messages/page.tsx` | Messaging is currently gated on authentication only (`useAuthGate`), not on role-verified state — intentional, since gating it further would be inventing the resolution |
| 5 | Review timeframe + rejected-item resubmission mechanism | `src/components/ui/StatusBanner.tsx` (pending copy), listing/service/ad detail pages | No duration stated; rejected items show status but no defined resubmit flow beyond a generic "Edit" |
| 6 | Effect of a lapsed subscription on a live listing | Not modeled | `subscriptionState` only gates *new* publication in `src/app/dashboard/listings/new/page.tsx`; nothing revokes a listing that's already live |
| 7 | Advertiser pricing/payment sequencing | `src/app/dashboard/ads/new/page.tsx`, `src/app/dashboard/ads/page.tsx` | Implemented as submit → "pending content review and terms" → (future) payment; upfront self-serve pricing was NOT assumed |
| 8 | Whether editing a live listing re-triggers review | `src/app/dashboard/listings/[id]/page.tsx` | "Edit Listing" button exists but has no wired behavior — deliberately inert rather than guessing |
| 9 | Final login credential mechanism | `src/app/login/page.tsx`, `src/components/shared/AuthGate.tsx` (inline login form) | Email/phone + password fields used as a labeled placeholder; no real credential validation exists (no backend) |

None of these were silently resolved during the audit pass — where a fix touched adjacent code (e.g. gating listing/service *submission* on role-verified state, which the docs *do* already specify), that was implemented; the 9 items above were left exactly as open as they were found.
