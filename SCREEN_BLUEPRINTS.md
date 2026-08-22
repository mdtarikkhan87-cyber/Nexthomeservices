# NextHome — Screen Blueprints

**Status:** Concise functional blueprint per screen — precedes wireframes and components. No visual layouts or code exist yet.
**Sources used:** [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) (screen list/IA), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (hybrid direction rules), [USER_JOURNEYS.md](USER_JOURNEYS.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md).

Every screen below corresponds 1:1 to a row in INFORMATION_ARCHITECTURE.md's screen tables. "Main sections in information-priority order" reflects DESIGN_SYSTEM.md §1's tone rule (public = Direction B emphasis, dashboard = Direction C emphasis, trust = Direction A floor everywhere).

---

## 1. Public Experience

### Homepage
- **Purpose:** Entry point; establish search as the first action (PRD §4)
- **Primary user goal:** Decide whether to search or browse
- **Required information:** None to enter; Rent/Sale toggle, search bar
- **Primary action:** Enter a search
- **Secondary actions:** Browse without searching, Post Property (gated), navigate to Services/Help
- **Key states:** Unauthenticated (always — this screen is never role-specific)
- **Main sections (priority order):** 1) Rent/Sale mode + search bar 2) Post Property CTA (always visible, PRD §4) 3) Featured/browsable listings preview 4) Services/Help entry points
- **Important transitions:** → Search Results, → Listing Detail, → Auth intercept (Post Property)

### Search Results (Rent / Sale)
- **Purpose:** Filtered listing discovery
- **Primary user goal:** Find listings matching price/state/bedrooms/duration
- **Required information:** State (dropdown), price range, bedrooms, Short-Term/Long-Term (Rent only)
- **Primary action:** Open a listing
- **Secondary actions:** Adjust/clear filters, switch Rent↔Sale mode
- **Key states:** Unauthenticated or authenticated (identical view either way, per PRODUCT_DECISIONS.md §2); zero-results empty state
- **Main sections (priority order):** 1) Filters (persistent, Direction A "nothing hidden") 2) Result count 3) Listing card grid — each card: status → price/location/bedrooms → photo → action
- **Important transitions:** → Listing Detail; results update live on filter change

### Listing Detail
- **Purpose:** Build confidence to message/save
- **Primary user goal:** Decide whether to contact the landlord
- **Required information:** None to enter; full photos, description, price, location, Verified status, view count
- **Primary action:** Message Landlord (dominant CTA)
- **Secondary actions:** Save (Tenant/Buyer, gated), share/back to results
- **Key states:** Listing must be live/approved to be reachable at all; unauthenticated → gated on Message/Save
- **Main sections (priority order):** 1) Verified status + price (always visible together, never separated) 2) Photos 3) Description/facts 4) Message CTA 5) View count / secondary metadata
- **Important transitions:** → Auth intercept (Message/Save), → Message Thread (once authenticated), → back to Search Results

### Service Directory
- **Purpose:** Browse trade services by category
- **Primary user goal:** Find a relevant local provider
- **Required information:** Category selection (admin-managed list)
- **Primary action:** Open a provider
- **Secondary actions:** Switch category
- **Key states:** Unauthenticated or authenticated; empty state per category/region
- **Main sections (priority order):** 1) Category selector 2) Provider cards (status → type/description → action)
- **Important transitions:** → Service Provider Detail

### Service Provider Detail
- **Purpose:** Build confidence to message a provider
- **Primary user goal:** Decide whether to contact the provider
- **Required information:** None to enter; service type, description, photos
- **Primary action:** Message Provider
- **Secondary actions:** Back to directory
- **Key states:** Must be live/approved; unauthenticated → gated on Message
- **Main sections (priority order):** 1) Verified status 2) Service type/description 3) Photos (if any) 4) Message CTA
- **Important transitions:** → Auth intercept, → Message Thread

### Help / FAQ
- **Purpose:** Self-serve answers (PRD §8.4)
- **Primary user goal:** Resolve a question without contacting support
- **Required information:** None to enter unless submitting a complaint/feedback
- **Primary action:** Find the relevant FAQ entry
- **Secondary actions:** Submit a complaint/feedback if unresolved
- **Key states:** Unauthenticated or authenticated
- **Main sections (priority order):** 1) FAQ topics (registering, verifying, posting, searching, subscribing) 2) Contact/complaint entry point
- **Important transitions:** → Feedback Form / Complaints Form (access model TBD — see IA Readiness Check)

### Advertise With Us
- **Purpose:** Present ad-placement offering (PRD §9)
- **Primary user goal:** Understand how to advertise and get started
- **Required information:** None to enter yet
- **Primary action:** Start ad submission (gated)
- **Secondary actions:** None
- **Key states:** Unauthenticated
- **Main sections (priority order):** 1) What ad placement offers 2) Self-serve submission entry point
- **Important transitions:** → Auth intercept → Advertiser registration → Submit Advertisement

---

## 2. Authentication Experience

### Auth Prompt (modal, over existing context)
- **Purpose:** Intercept a protected-action attempt in place (PRODUCT_DECISIONS.md §9)
- **Primary user goal:** Authenticate without losing context
- **Required information:** None yet — just Login/Register choice
- **Primary action:** Choose Login or Register
- **Secondary actions:** Dismiss (returns to public browsing, no action taken)
- **Key states:** Unauthenticated; the specific triggering action is captured and shown by name
- **Main sections (priority order):** 1) Named action ("Log in to message this landlord") 2) Login / Register options
- **Important transitions:** → Login, → Register — Role Selection

### Login
- **Purpose:** Authenticate an existing account
- **Primary user goal:** Get back into their account
- **Required information:** Email/phone + credential
- **Primary action:** Submit login
- **Secondary actions:** Forgot credential, switch to Register
- **Key states:** Unauthenticated → authenticated
- **Main sections (priority order):** 1) Credential fields 2) Submit 3) Alternate path (Register)
- **Important transitions:** → Return to original context (if triggered by gated action) or → Dashboard

### Register — Role Selection
- **Purpose:** Confirm which role this registration is for
- **Primary user goal:** Pick/confirm the correct role
- **Required information:** Role choice (auto-suggested from triggering action)
- **Primary action:** Confirm role
- **Secondary actions:** Change suggested role, switch to Login (existing account)
- **Key states:** Unauthenticated
- **Main sections (priority order):** 1) Suggested role (pre-selected) 2) Other role options
- **Important transitions:** → Register — Basic Info & OTP

### Register — Basic Info & OTP
- **Purpose:** Collect/verify phone + email — account-level, shared across all roles (PRODUCT_DECISIONS.md §6)
- **Primary user goal:** Complete the fast part of registration
- **Required information:** Phone number, email, OTP code
- **Primary action:** Verify phone, verify email
- **Secondary actions:** Resend OTP
- **Key states:** Unauthenticated → authenticated (email+phone verified)
- **Main sections (priority order):** 1) Phone + OTP 2) Email verification
- **Important transitions:** → [Tenant/Buyer, Advertiser] active dashboard; → [Landlord, Service Provider] Register — Trust Layer

### Register — Trust Layer
- **Purpose:** Collect role-specific verification requirements only (PRD §6.1) — Landlord/Service Provider only
- **Primary user goal:** Finish the steps needed to unlock listing/service creation
- **Required information:** Mother's maiden name, ID/utility bill document upload
- **Primary action:** Submit for review
- **Secondary actions:** None (linear, required flow)
- **Key states:** Authenticated → role added, additional requirements outstanding → submitted
- **Main sections (priority order):** 1) Explanation of why this step exists (approachable framing, per DESIGN_INTENT.md §3) 2) Mother's maiden name field 3) Document upload
- **Important transitions:** → Pending Review

### Pending Review (state screen/banner)
- **Purpose:** Communicate exactly what's being waited on
- **Primary user goal:** Understand status and what to do meanwhile
- **Required information:** None
- **Primary action:** Continue browsing / manage other active roles
- **Secondary actions:** Check status later (dashboard revisit)
- **Key states:** Role: pending admin document review; other roles on the account unaffected (PRODUCT_DECISIONS.md §8.1)
- **Main sections (priority order):** 1) Explicit "documents under review" status 2) What remains accessible meanwhile
- **Important transitions:** → Role Verified (on approval); → Rejected (resubmission mechanism open — see Readiness Check)

### Add a Role
- **Purpose:** Add a new role without creating a new account (PRODUCT_DECISIONS.md §8.1)
- **Primary user goal:** Extend the account with a new role's capabilities
- **Required information:** Only the new role's missing requirements — reused account-level info shown, not re-collected
- **Primary action:** Submit new role's requirements
- **Secondary actions:** Cancel
- **Key states:** Authenticated, existing role(s) verified; new role starts at "role added"
- **Main sections (priority order):** 1) Confirmation of reused info (email/phone) 2) New role-specific fields only
- **Important transitions:** → Pending Review (new role only) or immediate role-active — existing roles fully unaffected throughout

---

## 3. Landlord Experience

### Landlord Dashboard
- **Purpose:** Status home base
- **Primary user goal:** See what needs attention
- **Required information:** None to enter
- **Primary action:** Post a Property / respond to messages (whichever is more urgent)
- **Secondary actions:** Navigate to any dashboard sub-area
- **Key states:** Any role-state (dashboard always reachable once role added)
- **Main sections (priority order):** 1) Pending/urgent items (unread messages, rejected listings, pending subscription) 2) My Listings summary 3) Quick actions
- **Important transitions:** → My Listings, → Post a Property, → Subscription/Billing, → Tenant Messages

### My Listings
- **Purpose:** See all owned listings and status
- **Primary user goal:** Understand exactly where each listing stands
- **Required information:** None to enter
- **Primary action:** Open a listing to manage
- **Secondary actions:** Post a new listing
- **Key states:** Per-listing content-item state: pending / live / rejected — explicit, never blended
- **Main sections (priority order):** 1) Status-grouped or status-labeled list (pending/rejected surfaced first, DESIGN_SYSTEM.md §12) 2) Per-listing key facts
- **Important transitions:** → Listing Management Detail

### Post a Property (multi-step)
- **Purpose:** Create a new Rent or Sale listing
- **Primary user goal:** Get listing details submitted correctly, quickly (<5 min target, PRD §13)
- **Required information:** Address, price, bedrooms, description, photos, Rent/Sale type, Short-Term/Long-Term (if Rent)
- **Primary action:** Submit for review
- **Secondary actions:** Save draft, go back a step
- **Key states:** Role verified required to submit; subscription active required before publish (PRD §6.5) — both stated transparently before payment is requested
- **Main sections (priority order):** 1) Listing details form 2) Photo upload 3) Subscription/payment step (if not already active) 4) Submit
- **Important transitions:** → Subscription/Billing (if unsubscribed), → My Listings (pending state, once submitted)

### Subscription / Billing
- **Purpose:** Show cost transparently and process payment
- **Primary user goal:** Understand cost and activate publishing ability
- **Required information:** Payment method (Stripe/Paystack/bank transfer), payment details
- **Primary action:** Subscribe / pay
- **Secondary actions:** View current plan/pricing details, view promotions if any
- **Key states:** Role verified, subscription inactive → active (instant for card/Paystack, delayed for bank transfer)
- **Main sections (priority order):** 1) Pricing, stated plainly, before payment fields 2) Payment method selection 3) Payment form
- **Important transitions:** → My Listings (unblocks publish) or → pending confirmation state (bank transfer)

### Listing Management Detail
- **Purpose:** Edit/manage a specific listing
- **Primary user goal:** Keep listing accurate, view performance
- **Required information:** Whatever fields are being edited
- **Primary action:** Save changes
- **Secondary actions:** Unpublish (destructive-styled, confirmation required)
- **Key states:** Content-item-level state; view count only present if live
- **Main sections (priority order):** 1) Status 2) Editable listing fields 3) Performance (view count, if live) 4) Unpublish
- **Important transitions:** → My Listings; possible re-review on edit (open question, see Readiness Check)

### Tenant Messages (inbox)
- **Purpose:** See all conversations across listings
- **Primary user goal:** Respond to prospective tenants/buyers
- **Required information:** None to enter
- **Primary action:** Open a thread
- **Secondary actions:** None
- **Key states:** Any role-state (exact messaging gate is an open question — see Readiness Check)
- **Main sections (priority order):** 1) Unread threads first 2) Thread list, each tied to a listing
- **Important transitions:** → Message Thread

### Message Thread
- **Purpose:** Converse with a specific tenant/buyer
- **Primary user goal:** Reply and move the relationship forward
- **Required information:** Reply text
- **Primary action:** Send reply
- **Secondary actions:** None beyond the in-app on-platform reminder (PRD §6.4)
- **Key states:** —
- **Main sections (priority order):** 1) Message history 2) On-screen stay-in-app reminder 3) Reply composer
- **Important transitions:** → back to Tenant Messages

---

## 4. Tenant/Buyer Experience

### Tenant/Buyer Dashboard
- **Purpose:** Status home base
- **Primary user goal:** See saved homes and message activity
- **Required information:** None
- **Primary action:** Browse / open Saved Homes / open Messages
- **Secondary actions:** Navigate to Account
- **Key states:** Role verified (reached immediately at registration)
- **Main sections (priority order):** 1) Unread messages 2) Saved Homes preview 3) Quick browse entry point
- **Important transitions:** → Saved Homes, → Messages, → back to public Search

### Saved Homes
- **Purpose:** Manage bookmarked listings (PRODUCT_DECISIONS.md §4.1)
- **Primary user goal:** Review/compare saved listings, remove stale ones
- **Required information:** None
- **Primary action:** Open a listing
- **Secondary actions:** Unsave
- **Key states:** Role verified; empty state if none saved; a saved listing may have since become unavailable
- **Main sections (priority order):** 1) Saved listing cards (same anatomy as public browsing) 2) Unsave control per card
- **Important transitions:** → Listing Detail, → Message Thread

### Messages (inbox)
- **Purpose:** See conversations with landlords/providers (replaces "Property Applications," PRODUCT_DECISIONS.md §4.2)
- **Primary user goal:** Respond to landlord replies
- **Required information:** None
- **Primary action:** Open a thread
- **Secondary actions:** None
- **Key states:** Role verified
- **Main sections (priority order):** 1) Unread threads first 2) Thread list, each tied to a listing
- **Important transitions:** → Message Thread

### Message Thread
- Same structure as Landlord's Message Thread above, mirrored for the Tenant/Buyer side.

---

## 5. Service Provider Experience

### Service Provider Dashboard
- **Purpose:** Status home base
- **Primary user goal:** See listing status and messages
- **Required information:** None
- **Primary action:** Respond to messages / manage listing
- **Secondary actions:** Navigate to Account
- **Key states:** Any role-state
- **Main sections (priority order):** 1) Pending/urgent items 2) Listing status summary 3) Quick actions
- **Important transitions:** → My Service Listing, → Customer Messages

### My Service Listing
- **Purpose:** Create/manage the provider's listing
- **Primary user goal:** Get discovered by nearby customers, free (PRD §6.7)
- **Required information:** Category (admin-managed), description, contact details, photos
- **Primary action:** Submit / edit
- **Secondary actions:** Unpublish (destructive-styled)
- **Key states:** Role verified required for submission; content-item-level pending/live/rejected
- **Main sections (priority order):** 1) Status 2) Category/description/contact fields 3) Photos
- **Important transitions:** → Pending Review (content-item-level)

### Customer Messages (inbox) / Message Thread
- Same structure as Tenant Messages / Message Thread above, mirrored for the Service Provider side.

---

## 6. Advertiser Experience

### Advertiser Dashboard
- **Purpose:** Status home base
- **Primary user goal:** See ad status and billing
- **Required information:** None
- **Primary action:** Submit a new ad (core loop)
- **Secondary actions:** Navigate to Account
- **Key states:** Role verified (reached immediately, PRODUCT_DECISIONS.md §5)
- **Main sections (priority order):** 1) My Advertisements summary (status-first) 2) Billing status 3) Submit new ad entry point
- **Important transitions:** → My Advertisements, → Submit Advertisement

### My Advertisements
- **Purpose:** See all submitted ads and status
- **Primary user goal:** Track approval/placement progress
- **Required information:** None
- **Primary action:** Open an ad for detail
- **Secondary actions:** Submit a new ad
- **Key states:** Content-item-level: pending/approved/rejected, same vocabulary as listings
- **Main sections (priority order):** 1) Status-labeled ad list 2) Per-ad key facts
- **Important transitions:** → Ad Detail / Payment

### Submit Advertisement
- **Purpose:** Self-serve ad submission (PRD §9)
- **Primary user goal:** Get an ad in front of visitors
- **Required information:** Image, text, link
- **Primary action:** Submit for content review
- **Secondary actions:** Save draft
- **Key states:** Role verified
- **Main sections (priority order):** 1) Creative fields (image/text/link) 2) Submit
- **Important transitions:** → My Advertisements (pending state)

### Ad Detail / Payment
- **Purpose:** View status; complete payment once terms are set
- **Primary user goal:** Understand terms and pay if applicable
- **Required information:** None to enter until payment step
- **Primary action:** Pay / confirm
- **Secondary actions:** None
- **Key states:** Content-item pending → approved/rejected; payment state separate; sequencing (pre- vs. post-approval pricing) is an open question — see Readiness Check
- **Main sections (priority order):** 1) Status 2) Placement/duration/cost terms (once admin-set) 3) Payment
- **Important transitions:** → My Advertisements

---

## 7. Admin Areas (minimally scoped — see IA note)

These are restated at the same coarse level as INFORMATION_ARCHITECTURE.md, per that document's explicit note that Admin lacks upstream journey-level detail. Full blueprints are deferred pending a dedicated Admin journey pass (flagged again below).

- **Admin Dashboard** — overview of all users, listings, payments (PRD §6.8)
- **Approvals Queue** — approve/reject listings, service providers, ads
- **Revenue / Payments** — total revenue, bank-transfer confirmation
- **Pricing & Promotions** — set/adjust subscription and ad pricing
- **Ratings / Complaints** — review ratings, manage complaint tickets
- **Categories** — add/edit/remove service categories
- **Ads Management** — review, approve, price, place ads

---

## 8. Shared / Cross-Cutting

### Account / Profile
- **Purpose:** Manage personal info, per-role verification status, role switching
- **Primary user goal:** Keep account info current; understand role states
- **Required information:** Profile edits as needed
- **Primary action:** Edit profile / switch role / add a role
- **Secondary actions:** Logout
- **Key states:** Account-level + all held roles' states, shown distinctly per role (DESIGN_SYSTEM.md §7)
- **Main sections (priority order):** 1) Per-role verification status list 2) Role switcher 3) Profile fields 4) Add a Role entry point
- **Important transitions:** → Add a Role, → target role's Dashboard

### Ratings & Reviews (submission)
- **Purpose:** Leave a rating/review after an interaction (PRD §8.1)
- **Primary user goal:** Provide feedback tied to a landlord/listing
- **Required information:** Star rating, short review text
- **Primary action:** Submit review
- **Secondary actions:** Cancel
- **Key states:** Role verified (Tenant/Buyer)
- **Main sections (priority order):** 1) Star rating 2) Review text
- **Important transitions:** → back to originating listing/thread

### Feedback Form
- **Purpose:** General suggestions not tied to a listing (PRD §8.2)
- **Primary user goal:** Report something to the platform
- **Required information:** Free-text feedback
- **Primary action:** Submit
- **Secondary actions:** Cancel
- **Key states:** Authenticated (any role) — explicitly required per PRD §8.2
- **Main sections (priority order):** 1) Feedback field 2) Submit
- **Important transitions:** → confirmation

### Complaints Form
- **Purpose:** Report a bad-actor landlord, suspicious listing, or scam (PRD §8.3)
- **Primary user goal:** Get a specific concern on record
- **Required information:** What/who is being reported, description
- **Primary action:** Submit complaint
- **Secondary actions:** Cancel
- **Key states:** Access model unclear (authenticated-only vs. open — see Readiness Check)
- **Main sections (priority order):** 1) What's being reported 2) Description 3) Submit
- **Important transitions:** → ticket created, visible to user and Admin

---

## Design Foundation Readiness Check

**BLOCKER** — must be resolved before component/wireframe planning:

None identified. Both files build cleanly on the approved hybrid direction and all upstream documents without requiring any new, unresolved product decision.

**IMPORTANT** — should be resolved before implementation (mostly carried forward, not new):

1. **Status color extension needs brand sign-off** (DESIGN_SYSTEM.md §2) — the Brand Guidelines define no success/warning/error colors; `status-rejected`/`status-error` specifically requires a genuinely new, non-brand color, which should be confirmed with whoever owns the brand guidelines before token implementation.
2. **Admin screens remain only minimally blueprinted** (carried from INFORMATION_ARCHITECTURE.md) — no dedicated Admin journey work exists yet to blueprint against in the same depth as the four end-user roles.
3. **Complaints form access model is still unclear** (carried from IA) — affects whether it's public or authenticated-gated.
4. **Exact verification requirement for messaging** (carried from USER_JOURNEYS.md/IA) — affects the "Key states" line on every Messages/Message Thread blueprint above.
5. **No defined timeframe for admin review, or resubmission mechanism for rejected items** (carried forward) — affects the Pending Review and Listing/Service/Ad Detail blueprints' next-step content.
6. **Effect of a lapsed Landlord subscription on an already-live listing** (carried forward) — affects whether My Listings needs a distinct "at risk" state.
7. **Advertiser pricing sequencing** (carried forward) — affects whether Ad Detail/Payment is one screen or two sequential ones.
8. **Whether editing a live listing re-triggers admin re-review** (carried forward) — affects Listing Management Detail's transition behavior.

**LATER:**

9. Exact rejection-reason display detail (carried forward).
10. Saved Homes count limit, if any (carried forward).
11. Full content/scope of the Ratings & Reviews submission screen beyond star + short text.

---

None of the above are BLOCKER-level, and none require inventing a new product requirement to proceed with component and wireframe planning — they are refinements to resolve alongside or ahead of implementation, not structural obstacles.

**DESIGN FOUNDATION READY FOR COMPONENT AND WIREFRAME PLANNING.**
