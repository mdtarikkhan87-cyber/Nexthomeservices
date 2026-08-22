# NextHome — Wireframe Plan

**Status:** Low-fidelity structural plans (text only) — precedes visual mockups and code. No visuals or code exist yet.
**Sources used:** [SCREEN_BLUEPRINTS.md](SCREEN_BLUEPRINTS.md), [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md).

Screens that share a structural pattern are explicitly consolidated rather than repeated — noted at the top of each group. Every numbered structure below is a top-to-bottom information order, not a visual layout.

---

## PUBLIC

### SCREEN: Homepage
- **User/role:** Public Visitor
- **Purpose:** Entry point; establish search as the first action
- **Desktop structure:**
  1. Global navigation (logo, Browse Rent/Sale, Services, Help, Login/Register)
  2. Hero: Rent/Sale mode toggle + search bar (dominant, per PRD §4)
  3. "Post Property" CTA (secondary to search, but always visible)
  4. Featured/browsable listing cards (public-density Property Card)
  5. Services entry point
  6. Footer
- **Mobile structure:** Same order; search bar becomes full-width, nav collapses to a menu control, listing cards stack single-column
- **Primary CTA placement:** Search bar, hero-level, above the fold
- **Secondary actions:** Post Property CTA, Browse Services
- **Important states:** Unauthenticated only (this screen never varies by role)
- **Gated-action behavior:** Post Property triggers Auth Prompt Modal if unauthenticated
- **Information priority order:** Search entry → Post Property CTA → listings preview → services

---

### SCREEN: Property Search / Results
*(Covers both Rent and Sale mode — same structural pattern, mode toggle changes content/fields, not layout.)*
- **User/role:** Public Visitor (identical when authenticated, per PRODUCT_DECISIONS.md §2)
- **Purpose:** Filtered listing discovery
- **Desktop structure:**
  1. Global navigation
  2. Search bar + mode toggle (persistent, top of content area)
  3. Filter Panel (persistent sidebar — state, price, bedrooms, Short-Term/Long-Term if Rent)
  4. Result count
  5. Property Card grid (public-density variant), each card: Trust/Verification Indicator + price → location/bedrooms → photo → action
  6. Pagination / Load More
- **Mobile structure:** Search bar + mode toggle stay top; Filter Panel collapses into a drawer (triggered by a "Filters" button); result count + card grid single-column below; pagination at bottom
- **Primary CTA placement:** None screen-level — primary action lives per-card (open listing)
- **Secondary actions:** Adjust filters, switch mode
- **Important states:** Zero-results empty state; loading state while filters apply
- **Gated-action behavior:** None at this screen level (browsing is never gated)
- **Information priority order:** Filters/mode → result count → cards (status+price first per card) → pagination

---

### SCREEN: Property Details
- **User/role:** Public Visitor / Tenant/Buyer (identical structure, gated actions differ only in whether they trigger Auth Prompt)
- **Purpose:** Build confidence to message/save
- **Desktop structure:**
  1. Global navigation
  2. Breadcrumb (Search Results → this listing)
  3. Property identity: Trust/Verification Indicator + Price (shown together, never separated, per DESIGN_SYSTEM.md §11)
  4. Property Image Gallery
  5. Property Summary (location, bedrooms, Rent/Sale type, duration tag if Rent)
  6. Primary action: Message Landlord (dominant CTA)
  7. Secondary action: Save (Tenant/Buyer)
  8. Property Facts List (full description)
  9. View count / secondary metadata
  10. Related listings (optional, low priority)
- **Mobile structure:** Same order; gallery becomes a swipeable single-image view; Message CTA becomes a sticky bottom-anchored button for reachability
- **Primary CTA placement:** Immediately after Property Summary, above the fold on desktop; sticky bottom on mobile
- **Secondary actions:** Save, share, back to results
- **Important states:** Listing must be live/approved to be reachable; unavailable-listing fallback state
- **Gated-action behavior:** Message/Save trigger Auth Prompt Modal if unauthenticated, preserving this exact context (PRODUCT_DECISIONS.md §9)
- **Information priority order:** Trust status + price → photos → facts → message action → description → metadata

---

### SCREEN: Service Browsing / Details
*(Structurally identical to Property Search/Results and Property Details, minus price/bedroom fields — not wireframed separately; reuses the same two patterns above with: category selector instead of price/bedroom filters, and service type/description instead of Property Summary/Facts.)*

---

### SCREEN: Authentication Prompt
- **User/role:** Public Visitor (any)
- **Purpose:** Intercept a protected-action attempt in place
- **Desktop structure (modal, overlaying current context):**
  1. Named action ("Log in to message this landlord")
  2. Login option
  3. Register option (role pre-selected from triggering action)
  4. Dismiss control
- **Mobile structure:** Same content, full-width bottom-sheet-style modal rather than centered dialog (better reachability on small viewports)
- **Primary CTA placement:** Register (or Login, if the user is a likely returning user — not distinguishable at this stage; both presented with equal visual weight per DESIGN_INTENT.md, since this is a genuine either/or choice, not a primary/secondary pair)
- **Secondary actions:** Dismiss
- **Important states:** None beyond default — this modal doesn't itself carry loading/error states (those live in Login/Register)
- **Gated-action behavior:** This *is* the gated-action behavior — anchors visually near its trigger point per DESIGN_SYSTEM.md §13
- **Information priority order:** Named action first (context), then the two paths

---

## AUTHENTICATION

### SCREEN: Login
- **User/role:** Any returning user
- **Desktop structure:**
  1. Minimal nav (logo only, or none — focused flow)
  2. Credential fields (email/phone + password or OTP, depending on final auth mechanism — not specified in source docs, flagged in Readiness Check)
  3. Submit
  4. "Forgot credential" link
  5. Switch-to-Register link
- **Mobile structure:** Same order, full-width fields
- **Primary CTA placement:** Submit, directly below fields
- **Secondary actions:** Forgot credential, Register
- **Important states:** default, submitting, error (invalid credential)
- **Gated-action behavior:** On success, returns to original context if triggered by a gated action (Auth Prompt), otherwise proceeds to Dashboard
- **Information priority order:** Fields → submit → alternate paths

---

### SCREEN: Registration / Role Selection / Verification-Pending State
*(These three are documented together as one flow — they are sequential steps of one journey, not independent screen patterns, per USER_JOURNEYS.md's Role-Aware Registration journey.)*

**Step 1 — Role Selection:**
1. Suggested role (pre-selected from triggering action)
2. Other role options (Landlord, Tenant/Buyer, Service Provider, Advertiser)
3. Continue

**Step 2 — Basic Info & OTP (all roles, account-level):**
1. Phone number field → OTP entry
2. Email field → verification
3. Continue

**Step 3 — Trust Layer (Landlord/Service Provider only — skipped entirely for Tenant/Buyer and Advertiser, per PRODUCT_DECISIONS.md §5):**
1. Brief explanation of why this step exists (approachable framing)
2. Mother's maiden name field
3. Document upload control
4. Submit for review

**Step 4 — Verification/Pending State:**
1. Explicit status: "Your documents are under review" (Landlord/Service Provider) OR immediate "Account active" confirmation (Tenant/Buyer, Advertiser)
2. What remains accessible meanwhile (browsing, other active roles)
3. Continue to Dashboard

- **Desktop/Mobile structure:** Identical step order on both; mobile uses full-width single-column fields at each step, desktop may center a fixed-width column — no structural difference beyond field width
- **Primary CTA placement:** Bottom of each step, consistently positioned
- **Secondary actions:** Back (previous step), Resend OTP
- **Important states:** per-step validation error, OTP-expired, document-upload error
- **Gated-action behavior:** On completing the flow, returns to original gated-action context where the requirement is now satisfied (Tenant/Buyer, Advertiser) or shows the Pending state with the action still blocked (Landlord/Service Provider) — see COMPONENT_ARCHITECTURE.md §6, Blocked/Pending states
- **Information priority order:** Role → account-level identity → role-specific requirements (only if applicable) → status

---

## LANDLORD

### SCREEN: Landlord Dashboard
- **Desktop structure:**
  1. Global navigation (authenticated variant — account menu)
  2. Dashboard Sidebar/Nav (My Listings, Post a Property, Subscription/Billing, Messages)
  3. Summary/Attention Panel (unread messages, rejected listings, pending subscription — surfaced first)
  4. My Listings summary preview
  5. Quick actions
- **Mobile structure:** Sidebar collapses to a bottom tab bar or top horizontal scroll nav (see RESPONSIVE_STRATEGY.md); Summary/Attention Panel remains first in content order
- **Primary CTA placement:** Post a Property (or "respond to messages" if that's more urgent — resolved dynamically by the Summary Panel's priority logic, not fixed)
- **Secondary actions:** Navigate to any sub-area
- **Important states:** empty (no listings yet — first-time state), all-clear (no urgent items)
- **Information priority order:** Urgent items → listings summary → quick actions

---

### SCREEN: My Listings
- **Desktop structure:**
  1. Dashboard Shell (sidebar + header)
  2. Status-grouped or status-labeled list (pending/rejected surfaced first)
  3. Management List (Property Card, dashboard-density variant, per listing) — Listing Status Indicator explicit per row
  4. Post a new listing entry point
- **Mobile structure:** Same order, single-column list, status label remains full-width and unabbreviated (never a color-only dot, per DESIGN_SYSTEM.md §14)
- **Primary CTA placement:** "Post a Property" — top of list or persistent floating action on mobile
- **Secondary actions:** Open a listing to manage
- **Important states:** empty (no listings), per-item pending/live/rejected
- **Information priority order:** Status-first ordering → per-listing key facts

---

### SCREEN: Create/Edit Listing (Post a Property)
- **Desktop structure:**
  1. Dashboard Shell
  2. Step indicator (if multi-step)
  3. Listing details form (address, price, bedrooms, description, Rent/Sale type, duration tag if Rent)
  4. Photo upload
  5. Subscription/payment step (only if not already subscribed — shown transparently before submission, per DESIGN_SYSTEM.md §9)
  6. Submit for review
- **Mobile structure:** Same step order, one field group per screen-height section rather than a dense single page, to keep the <5-minute target (PRD §13) achievable on small viewports
- **Primary CTA placement:** Submit, end of flow; "Continue" per step
- **Secondary actions:** Save draft, go back a step
- **Important states:** draft, validating, submitting, blocked-on-subscription
- **Gated-action behavior:** If unsubscribed, flow routes to Subscription/Billing before final submission — never silently blocks at the end
- **Information priority order:** Listing facts → photos → payment (only if needed) → submit

---

### SCREEN: Listing Review/Status (Listing Management Detail)
- **Desktop structure:**
  1. Dashboard Shell
  2. Listing Status Indicator (pending/live/rejected, explicit)
  3. Editable listing fields
  4. Performance (view count, if live)
  5. Unpublish (destructive-styled, requires confirmation)
- **Mobile structure:** Same order, single column
- **Primary CTA placement:** Save changes
- **Secondary actions:** Unpublish
- **Important states:** pending (no edits possible pending resolution of the re-review-on-edit open question — flagged, not resolved), live, rejected (next-step content open, per Readiness Check)
- **Information priority order:** Status → editable facts → performance → destructive action (last, isolated)

---

### SCREEN: Subscription/Billing
- **Desktop structure:**
  1. Dashboard Shell
  2. Pricing, stated plainly (including any active promotions) — before any payment field
  3. Payment method selection (Stripe/Paystack/bank transfer)
  4. Payment form
  5. Confirmation / pending-confirmation (bank transfer) state
- **Mobile structure:** Same order, single column, payment form uses full-width fields
- **Primary CTA placement:** Subscribe/Pay, after payment form
- **Secondary actions:** View current plan details
- **Important states:** inactive, processing, active, pending-confirmation (bank transfer)
- **Information priority order:** Cost transparency first (Direction A overrides Direction B's usual brevity here, per DESIGN_SYSTEM.md §9) → method → payment → confirmation

---

### SCREEN: Messages (Landlord — Tenant Messages)
*(Structurally identical for Tenant/Buyer's Messages and Service Provider's Customer Messages — one pattern, documented once.)*
- **Desktop structure (inbox view):**
  1. Dashboard Shell
  2. Unread threads surfaced first
  3. Thread list, each item tied to a specific listing
- **Desktop structure (thread view):**
  1. Message history
  2. On-screen "stay in app" reminder (PRD §6.4)
  3. Reply composer
- **Mobile structure:** Inbox and thread are separate full-screen views (not split-pane) — list first, tap into a thread, back control returns to list
- **Primary CTA placement:** Reply composer, bottom of thread view (sticky on mobile)
- **Secondary actions:** None beyond the reminder
- **Important states:** empty inbox, unread indicator, sending
- **Information priority order:** Unread first → thread list → (within a thread) history → composer

---

## TENANT/BUYER

### SCREEN: Tenant/Buyer Dashboard
- Same structural pattern as Landlord Dashboard above, with role-specific content: Summary/Attention Panel (unread messages, saved homes preview), quick browse entry point instead of "Post a Property."

### SCREEN: Saved Homes
- **Desktop structure:**
  1. Dashboard Shell
  2. Saved Property Card grid (same anatomy as public Property Card)
  3. Unsave control per card
- **Mobile structure:** Single-column card list
- **Primary CTA placement:** None screen-level — per-card actions (open listing, unsave)
- **Secondary actions:** Unsave
- **Important states:** empty ("No saved homes yet — browse listings to save your favorites"), listing-no-longer-available fallback per card
- **Information priority order:** Card grid, most-recently-saved first (reasonable default, not specified in source docs)

### SCREEN: Messages (Tenant/Buyer)
- Reuses the Messages pattern documented under Landlord above.

---

## SERVICE PROVIDER

### SCREEN: Service Provider Dashboard
- Same structural pattern as Landlord Dashboard, with role-specific content: listing status summary instead of "My Listings" preview, no Subscription/Billing entry (not applicable to this role per PRD §6.7/§14).

### SCREEN: Service Listing Management
- **Desktop structure:**
  1. Dashboard Shell
  2. Status indicator (content-item-level: pending/live/rejected)
  3. Category selector (admin-managed list)
  4. Description/contact fields
  5. Photos
  6. Submit/Save
- **Mobile structure:** Same order, single column
- **Primary CTA placement:** Submit/Save, end of form
- **Secondary actions:** Unpublish (destructive-styled)
- **Important states:** draft, pending, live, rejected
- **Information priority order:** Status → category/description → photos → submit

### SCREEN: Messages (Service Provider — Customer Messages)
- Reuses the Messages pattern documented under Landlord above.

---

## ADVERTISER

### SCREEN: Advertiser Dashboard
- Same structural pattern as Landlord Dashboard, with role-specific content: My Advertisements summary (status-first) and billing status, instead of listings.

### SCREEN: Advertisement Management (My Advertisements + Submit Advertisement)
- **My Advertisements (list) desktop structure:**
  1. Dashboard Shell
  2. Status-labeled ad list (Management List component)
  3. Submit new ad entry point
- **Submit Advertisement desktop structure:**
  1. Dashboard Shell
  2. Creative fields: image, text, link
  3. Submit for content review
- **Mobile structure:** Same order for both, single column
- **Primary CTA placement:** Submit (new ad); "Submit new ad" entry point on the list screen
- **Secondary actions:** Save draft
- **Important states:** draft, submitting, pending, approved, rejected
- **Information priority order:** Status list first → creative fields on submission screen

### SCREEN: Advertisement Status (Ad Detail / Payment)
- **Desktop structure:**
  1. Dashboard Shell
  2. Status (pending/approved/rejected)
  3. Placement/duration/cost terms — **shown only once admin has set them; before that, an explicit "pending terms" state is shown rather than an empty pricing section** (sequencing open, per Readiness Check item 7)
  4. Payment (only once terms are set)
- **Mobile structure:** Same order, single column
- **Primary CTA placement:** Pay/confirm, only enabled once terms exist
- **Secondary actions:** None
- **Important states:** pending-content-review, pending-terms, terms-set, paid, rejected
- **Information priority order:** Status → terms (or pending-terms notice) → payment

---

## Screens Deliberately Not Wireframed Separately

Per the instruction to avoid separate wireframes for screens that reuse a structural pattern:

- **Service Browsing/Details** — reuses Search Results + Property Details patterns (noted inline above).
- **All three Messages inboxes/threads** (Landlord, Tenant/Buyer, Service Provider) — one shared pattern (noted inline above).
- **All four Dashboards** (Landlord, Tenant/Buyer, Service Provider, Advertiser) — one shared shell pattern with role-specific content swapped in (noted inline above).
- **Account/Profile, Ratings & Reviews, Feedback, Complaints** — not in the prioritized critical list for this phase; their structure is already defined at blueprint level in SCREEN_BLUEPRINTS.md and can be wireframed in a later pass without blocking the critical-path screens above.
- **Admin screens** — not wireframed here, consistent with SCREEN_BLUEPRINTS.md's note that Admin lacks upstream journey-level detail to wireframe against responsibly.
