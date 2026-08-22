# NextHome — Information Architecture

**Status:** Structural definition — precedes visual/design direction work.
**Sources used:** `NextHome_PRD_Phase1_Final.pdf`, `Next Home Brand Guidelines.pdf`, `NextHome_Final_TechStack.pdf`, [PRODUCT_UNDERSTANDING.md](PRODUCT_UNDERSTANDING.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [DESIGN_INTENT.md](DESIGN_INTENT.md), [USER_JOURNEYS.md](USER_JOURNEYS.md).

No new product requirements are introduced in this document. Every screen/route below maps to a capability already defined in the PRD or approved in PRODUCT_DECISIONS.md/USER_JOURNEYS.md. Where PRD-required Admin capability exists but wasn't given full journey-level detail upstream (Admin was explicitly out of scope for the access-model and journey work — PRODUCT_DECISIONS.md §1), that gap is carried forward here rather than filled in.

---

## Product Areas

1. **Public Experience** — unauthenticated browsing, open to everyone
2. **Authentication Experience** — login, role-aware registration, verification
3. **Landlord Experience** — dashboard and role-specific tools
4. **Tenant/Buyer Experience** — dashboard and role-specific tools
5. **Service Provider Experience** — dashboard and role-specific tools
6. **Advertiser Experience** — dashboard and role-specific tools
7. **Admin Areas** — required by PRD §6.8, but scoped minimally here (see note below)
8. **Shared/Cross-Cutting** — account & profile, role switching, notifications surface for messages

**Admin note:** The PRD requires a single admin dashboard covering approvals, user/payment visibility, pricing, bank-transfer confirmation, ratings/complaints, categories, and ads (PRD §6.8). PRODUCT_DECISIONS.md explicitly placed Admin auth on a separate, non-public path and out of scope for the access-model/journey design work done so far. This document lists Admin's required screens at a structural level only, consistent with what the PRD states — it does not attempt to newly design Admin's IA in the depth given to the four end-user roles, since no journey-level detail exists yet to build from. This gap is carried into the Readiness Check as IMPORTANT, not invented around.

---

## Screens and Routes

Legend for **Access**: `Public` = no auth required · `Auth (any)` = any authenticated user, any role · `Auth (role: verified)` = requires that role's role-level "verified" state · `Auth (role: subscribed)` = requires role-verified + subscription active (Landlord only).

### 1. Public Experience

| Screen/Route | Role | Access | Purpose | Primary User Goal | Most Important Info | Primary Action | Relevant States | Key Transitions |
|---|---|---|---|---|---|---|---|---|
| Homepage | Public Visitor | Public | Entry point; establish Rent/Sale search as the first thing seen (PRD §4) | Decide whether to search or browse | Rent/Sale mode toggle, search bar, "Post Property" CTA | Enter search / browse | Unauthenticated | → Search Results, → Listing Detail (via featured), → Post Property (gated) |
| Search Results (Rent) | Public Visitor | Public | Filtered listing discovery | Find listings matching price/state/bedrooms/duration | Listing cards: photo, price, location, bedrooms, Verified status, view count (PRD §4) | Open a listing / refine filters | Unauthenticated | → Listing Detail |
| Search Results (Sale) | Public Visitor | Public | Same as above, Sale mode | Same as above, sale price instead of rent | Same as above, one-time sale price (PRD §4 scope note) | Open a listing / refine filters | Unauthenticated | → Listing Detail |
| Listing Detail | Public Visitor | Public (listing must be live/approved) | Build confidence to message/save | Decide whether to contact the landlord | Full photos, description, price, location, Verified badge, view count | Message Landlord (dominant CTA, DESIGN_INTENT.md §5) | Unauthenticated → gated on Message/Save | → Auth intercept (Message/Save), → back to Search Results |
| Service Directory | Public Visitor | Public | Browse trade services by category | Find a relevant local provider | Category list (admin-managed, PRD §6.7), provider cards | Select a category / open a provider | Unauthenticated | → Service Provider Detail |
| Service Provider Detail | Public Visitor | Public (listing must be live/approved) | Build confidence to message | Decide whether to contact the provider | Service type, description, photos, contact intent | Message Provider (gated) | Unauthenticated → gated on Message | → Auth intercept |
| Help / FAQ | Public Visitor | Public | Self-serve answers on registering, verifying, posting, searching, subscribing (PRD §8.4) | Resolve a question without contacting support | FAQ content, contact/complaint entry point | Submit a complaint/feedback (if unresolved) | Unauthenticated | → Complaint/Feedback form (gated on submission, since it's tied to a logged-in user per PRD §8.2, or may accept anonymous submissions for complaints — **not explicitly specified, see Readiness Check**) |
| Advertise With Us | Public Visitor / Advertiser | Public (viewing); Auth (any) for submission | Present the ad-placement offering (PRD §9) | Understand how to advertise and get started | What ad placement offers, self-serve submission entry point | Start ad submission (gated) | Unauthenticated | → Auth intercept → Advertiser flow |

---

### 2. Authentication Experience

| Screen/Route | Role | Access | Purpose | Primary User Goal | Most Important Info | Primary Action | Relevant States | Key Transitions |
|---|---|---|---|---|---|---|---|---|
| Auth Prompt (modal) | Public Visitor | Public (triggered by gated action) | Intercept a protected-action attempt in place (PRODUCT_DECISIONS.md §9) | Authenticate without losing context | The specific action that triggered it, named explicitly | Choose Login or Register | unauthenticated | → Login, → Register |
| Login | Any returning user | Public | Authenticate an existing account | Get back into their account | Email/phone + credential fields | Submit login | unauthenticated → authenticated | → Return to original context (Section 4 below) |
| Register — Role Selection | Public Visitor | Public | Establish which role this registration is for (auto-suggested from triggering action, user can change) | Pick/confirm the correct role | Role options: Landlord, Tenant/Buyer, Service Provider, Advertiser | Confirm role | unauthenticated | → Register — Basic Info |
| Register — Basic Info & OTP | New user, any role | Public | Collect and verify phone + email — account-level, shared by every role (PRODUCT_DECISIONS.md §6) | Complete the fast part of registration | Phone number, email, OTP code entry | Verify phone, verify email | unauthenticated → authenticated (email+phone verified) | → [Tenant/Buyer, Advertiser] Role-active dashboard; → [Landlord, Service Provider] Register — Trust Layer |
| Register — Trust Layer (mother's maiden name + document upload) | New Landlord / Service Provider | Auth (any) | Collect role-specific verification requirements only (PRD §6.1) | Finish the steps needed to unlock listing/service creation | Mother's maiden name field, document upload control | Submit for review | authenticated → role added, additional requirements outstanding | → Pending Review state |
| Pending Review (state screen/banner) | Landlord / Service Provider (that role) | Auth (role: pending) | Communicate exactly what's being waited on | Understand status and what to do meanwhile | Explicit "documents under review" messaging; other roles on the account remain fully usable (PRODUCT_DECISIONS.md §8.1) | Continue browsing / manage other active roles | role: pending admin document review | → Role Verified (on admin approval), → Rejected (see Readiness Check on resubmission) |
| Add a Role (from existing account) | Any authenticated multi-role user | Auth (any) | Add a new role without creating a new account (PRODUCT_DECISIONS.md §8.1) | Extend the account with a new role's capabilities | Reused account-level info (email/phone, shown not re-collected); only new role-specific fields requested | Submit new role's requirements | authenticated, existing role(s) verified | → Pending Review (new role only) or immediate role-active (Tenant/Buyer, Advertiser) — existing roles unaffected |

---

### 3. Landlord Experience

| Screen/Route | Role | Access | Purpose | Primary User Goal | Most Important Info | Primary Action | Relevant States | Key Transitions |
|---|---|---|---|---|---|---|---|---|
| Landlord Dashboard | Landlord | Auth (role: any state — dashboard itself always reachable once role added) | Status home base (PRODUCT_DECISIONS.md §7) | See what needs attention | Pending items surfaced first: unread messages, rejected listings, pending subscription (DESIGN_INTENT.md §4) | Post a Property / respond to messages | Any Landlord role-state | → My Listings, → Post a Property, → Subscription/Billing, → Tenant Messages |
| My Listings | Landlord | Auth (role: any state) | See all owned listings and their status | Understand exactly where each listing stands | Explicit per-listing state: pending / live / rejected (never blended, DESIGN_INTENT.md Principle 2) | Open a listing to manage | Content-item-level state, independent of role state | → Listing Management Detail |
| Post a Property (multi-step) | Landlord | Auth (role: verified required to submit; drafting itself doesn't require it) | Create a new Rent or Sale listing | Get listing details submitted correctly | Address, price, bedrooms, description, photos, Rent/Sale type, Short-Term/Long-Term tag if Rent (PRD §6.2) | Submit for review | role verified required; subscription active required before publish (PRD §6.5) | → Subscription/Billing (if unsubscribed), → My Listings (pending state, once subscribed+submitted) |
| Subscription / Billing | Landlord | Auth (role: verified) | Show cost transparently and process payment (Design Principle 4) | Understand cost and activate ability to publish | Pricing (admin-configurable, incl. promotions), payment method choice: Stripe / Paystack / bank transfer (PRD §6.5, §7) | Subscribe / pay | role verified, subscription inactive → active | → My Listings (unblocks publish) |
| Listing Management Detail | Landlord | Auth (role: any state, listing owner only) | Edit/manage a specific listing | Keep listing accurate, view performance | Full listing fields, view count if live, status | Edit / unpublish | Content-item-level state | → My Listings |
| Tenant Messages (inbox) | Landlord | Auth (role: any state — see Readiness Check on exact messaging gate) | See all conversations across listings | Respond to prospective tenants/buyers | Thread list, tied to specific listings, unread indicators | Open a thread | Any Landlord role-state | → Message Thread |
| Message Thread | Landlord | Auth (same as above) | Converse with a specific tenant/buyer | Reply and move the relationship forward | Full message history, on-screen in-app reminder (PRD §6.4) | Send reply | — | → back to Tenant Messages |

---

### 4. Tenant/Buyer Experience

| Screen/Route | Role | Access | Purpose | Primary User Goal | Most Important Info | Primary Action | Relevant States | Key Transitions |
|---|---|---|---|---|---|---|---|---|
| Tenant/Buyer Dashboard | Tenant/Buyer | Auth (role verified — reached immediately at registration) | Status home base | See saved homes and message activity | Saved Homes count/preview, unread messages | Browse / open Saved Homes / open Messages | role verified | → Saved Homes, → Messages, → back to public Search |
| Saved Homes | Tenant/Buyer | Auth (role verified) | Manage bookmarked listings (PRODUCT_DECISIONS.md §4.1) | Review/compare saved listings, remove stale ones | Same card treatment as public browsing (DESIGN_INTENT.md consistency principle) | Open a listing / unsave | role verified | → Listing Detail, → Message Thread |
| Messages (inbox) | Tenant/Buyer | Auth (role verified) | See conversations with landlords/providers (replaces "Property Applications," PRODUCT_DECISIONS.md §4.2) | Respond to landlord replies | Thread list tied to specific listings | Open a thread | role verified | → Message Thread |
| Message Thread | Tenant/Buyer | Auth (role verified) | Converse with a specific landlord/provider | Continue the conversation | Full message history, on-screen reminder | Send reply | — | → back to Messages |

---

### 5. Service Provider Experience

| Screen/Route | Role | Access | Purpose | Primary User Goal | Most Important Info | Primary Action | Relevant States | Key Transitions |
|---|---|---|---|---|---|---|---|---|
| Service Provider Dashboard | Service Provider | Auth (role: any state) | Status home base | See listing status and messages | Listing status, unread messages | Respond to messages / manage listing | Any role-state | → My Service Listing, → Customer Messages |
| My Service Listing | Service Provider | Auth (role: verified required to submit) | Create/manage the provider's one listing | Get discovered by nearby customers, free (PRD §6.7) | Category (admin-managed), description, contact details, photos, status | Submit / edit | role verified required for submission | → Pending Review (content-item-level) |
| Customer Messages (inbox) | Service Provider | Auth (role: any state — same open question as Landlord, see Readiness Check) | See customer inquiries | Respond to customers | Thread list | Open a thread | Any role-state | → Message Thread |
| Message Thread | Service Provider | Auth (same as above) | Converse with a specific customer | Reply | Full message history | Send reply | — | → back to Customer Messages |

---

### 6. Advertiser Experience

| Screen/Route | Role | Access | Purpose | Primary User Goal | Most Important Info | Primary Action | Relevant States | Key Transitions |
|---|---|---|---|---|---|---|---|---|
| Advertiser Dashboard | Advertiser | Auth (role verified — reached immediately, PRODUCT_DECISIONS.md §5) | Status home base | See ad status and billing | My Advertisements list (submitted/pending/live/rejected), billing status | Submit a new ad (core loop) | role verified | → My Advertisements, → Submit Advertisement |
| My Advertisements | Advertiser | Auth (role verified) | See all submitted ads and status | Track approval/placement progress | Explicit per-ad state, same vocabulary as listings (pending/approved/rejected) | Open an ad for detail | Content-item-level state | → Ad Detail |
| Submit Advertisement | Advertiser | Auth (role verified) | Self-serve ad submission (PRD §9) | Get an ad in front of visitors | Image, text, link fields | Submit for content review | role verified | → My Advertisements (pending state) |
| Ad Detail / Payment | Advertiser | Auth (role verified, ad owner only) | View status; once admin sets placement/duration/cost, complete payment | Understand terms and pay if applicable | Placement, duration, cost (admin-set — sequencing open, see Readiness Check) | Pay / confirm | Content-item-level state: pending → approved/rejected; payment state separate | → My Advertisements |

---

### 7. Admin Areas (PRD-required, minimally scoped here)

| Screen/Route | Role | Access | Purpose (per PRD §6.8) |
|---|---|---|---|
| Admin Dashboard | Admin | Separate, non-public auth path (PRODUCT_DECISIONS.md §1) | Single overview: all users, listings (pending/live, rent/sale/services), all payments |
| Approvals Queue | Admin | Same | Approve/reject listings, service providers, ads |
| Revenue / Payments | Admin | Same | View total revenue; confirm bank-transfer payments needing manual matching |
| Pricing & Promotions | Admin | Same | Set/adjust subscription and ad pricing, including promotions |
| Ratings / Complaints | Admin | Same | Review ratings, respond to feedback, manage complaints (ticket status: open/in review/resolved) |
| Categories | Admin | Same | Add/edit/remove service provider categories |
| Ads Management | Admin | Same | Review, approve, price, place advertisements |

*No further structural detail is defined for Admin in this document — see Readiness Check.*

---

### 8. Shared / Cross-Cutting

| Screen/Route | Role | Access | Purpose | Primary User Goal | Most Important Info | Primary Action | Relevant States | Key Transitions |
|---|---|---|---|---|---|---|---|---|
| Account / Profile | Any authenticated user | Auth (any) | Manage personal info, see verification status per role, switch roles | Keep account info current; understand role states | Per-role verification status; role switcher (PRODUCT_DECISIONS.md §8) | Edit profile / switch role / add a role | Account-level + all held roles' states | → Add a Role, → target role's Dashboard |
| Ratings & Reviews (submission) | Tenant/Buyer | Auth (role verified) | Leave a rating/review after an interaction (PRD §8.1) | Provide feedback tied to a landlord/listing | Star rating, short review text | Submit review | role verified | → back to originating listing/thread |
| Feedback Form | Any authenticated user | Auth (any) | General suggestions not tied to a listing (PRD §8.2) | Report something to the platform | Free-text feedback field | Submit | authenticated | → confirmation |
| Complaints Form | Any user (**anonymous access unclear — see Readiness Check**) | Auth (any) per PRD §8.3 framing, though not stated explicitly as gated | Report a bad-actor landlord, suspicious listing, or scam | Get a specific concern on record | What/who is being reported, description | Submit complaint | — | → ticket created, visible to user and Admin |

---

## Navigation

**Global/Public Navigation** (visible to everyone, unauthenticated or not):
- Rent / Sale mode toggle + search entry point (always present, PRD §4)
- Browse Rent, Browse Sale, Services — primary top-level destinations
- "Post Property" CTA — always visible (PRD §4), triggers gated-action flow if unauthenticated
- Help/FAQ
- Login/Register entry point (replaced by account menu once authenticated)

**Authenticated Navigation** (added once logged in, layered on top of global nav — per DESIGN_INTENT.md §9, main nav does not fragment by role):
- Account menu (replaces Login/Register), containing: Dashboard (for the currently active role), Account/Profile, Role Switcher, Logout
- A persistent indicator of which role is currently active (DESIGN_INTENT.md §7)
- A messages/notifications entry point (unread count) — surfaces the active role's inbox

**Role-Specific Navigation** (lives inside the dashboard area, not the global nav):
- Landlord: My Listings, Post a Property, Subscription/Billing, Tenant Messages
- Tenant/Buyer: Saved Homes, Messages
- Service Provider: My Service Listing, Customer Messages
- Advertiser: My Advertisements, Submit Advertisement, Billing

**Account/Profile Navigation:**
- Personal info (name, contact details)
- Per-role verification status list (each held role shown with its own state — account-level vs. role-level distinction from PRODUCT_DECISIONS.md §6 must be visually legible here)
- Role Switcher (see below)
- Add a Role entry point

**Role Switching Access:**
- Reachable only from the Account/Profile area (PRODUCT_DECISIONS.md §8), never from the primary global nav, consistent with "one primary action per screen" and avoiding nav fragmentation.
- Switching updates the active-role indicator and swaps the dashboard/role-specific nav content; global public nav is unaffected.

**Shared vs. Role-Specific Areas:**
- **Shared:** global public nav, Account/Profile, Help/FAQ, Feedback/Complaints forms, the underlying Messages mechanism (UI shell shared across roles; content scoped per role).
- **Role-specific:** dashboards and their sub-navigation (My Listings vs. Saved Homes vs. My Service Listing vs. My Advertisements) — never blended, per DESIGN_INTENT.md anti-pattern list (no mixing multi-role data in one undifferentiated view).

---

## Public-to-Private Transitions

```
PUBLIC BROWSING
  ↓ user attempts a protected action (Message, Save, Post Property, etc.)
PROTECTED ACTION ATTEMPTED
  → system captures the specific action + exact context (PRODUCT_DECISIONS.md §9)
  ↓
AUTHENTICATION
  → Login (existing account) or Register (role-aware, PRODUCT_DECISIONS.md §5)
  ↓
ROLE / STATE VALIDATION
  → system checks whether current state satisfies the ORIGINAL action's
    specific requirement (authenticated-only / role-verified / role-verified+subscribed)
  → if unmet: user shown the SPECIFIC unmet condition, action stays visibly blocked
    (never silent — DESIGN_INTENT.md Principle 2)
  ↓
RETURN TO ORIGINAL CONTEXT
  → user lands back exactly where they were
  ↓
RESUME ACTION WHERE SAFE
  → no side effects: auto-resumes (e.g. reopen message composer)
  → financial/consequential: returns to context, requires explicit re-initiation
    (PRODUCT_DECISIONS.md §10)
```

**Pending verification** (Landlord/Service Provider, role-level): user remains fully able to browse and access their dashboard; only the specific role-gated actions (submit listing/service for review) stay blocked, with the pending state named explicitly, not hidden.

**Pending admin review** (content-item-level: a specific listing/service/ad): distinct from role-level pending verification — a fully role-verified Landlord can still have an individual listing pending. The IA must expose both layers separately (role-status in Account/Profile; content-status in My Listings/My Service Listing/My Advertisements) rather than one merged "pending" concept.

**Subscription inactive:** Landlord role is verified but "Post a Property" flow routes to Subscription/Billing before a listing can be submitted; My Listings and dashboard remain accessible throughout.

**Subscription active:** unblocks listing submission; per-listing content review (admin) still applies independently.

**Multi-role switching:** Account/Profile → Role Switcher → target role's dashboard becomes active; the previous role's data/state is untouched and remains reachable by switching back. Adding a brand-new role reuses account-level email/phone and only requests that role's own missing requirements (PRODUCT_DECISIONS.md §8.1) — reflected in the "Add a Role" screen above.

---

## Progressive Disclosure

**Immediately visible (no interaction required):**
- Rent/Sale mode, search bar, "Post Property" CTA (homepage)
- Listing card: photo, price, location, bedrooms, Verified status, view count
- Listing detail: full photos, price, description, Verified badge, Message CTA
- Dashboard: pending/urgent items (unread messages, rejected content, unresolved subscription) surfaced first, per DESIGN_INTENT.md §4

**One level deeper (one click/tap away):**
- Full message thread history (from inbox)
- Individual saved-home management (from Saved Homes list)
- Listing edit form (from My Listings)
- Ad detail/payment terms (from My Advertisements)
- Per-role verification status detail (from Account/Profile)

**Contextual (appears only when triggered by a specific action):**
- Authentication modal (only on a gated-action attempt)
- Subscription/Billing prompt (only when a Landlord attempts to publish while unsubscribed)
- Pending-review explanatory messaging (only when a state-gated action is attempted while pending)
- Role-selection step (only during registration or "Add a Role")

**Hidden until needed (never surfaced proactively):**
- Basic Trust Layer document-upload UI — never shown to Tenant/Buyer or Advertiser roles at any point (PRODUCT_DECISIONS.md §5)
- Admin-only screens and controls — never exposed in end-user navigation at all
- Bank-transfer manual-matching detail — an Admin-side concern, not surfaced to the Landlord beyond "payment pending confirmation"

---

## Final Sitemap

```
/ (Homepage)
├── /search?mode=rent
├── /search?mode=sale
├── /listing/[id]                         (public detail)
├── /services                              (Service Directory)
├── /services/[id]                         (Service Provider Detail, public)
├── /help                                  (Help/FAQ)
├── /advertise                             (Advertise With Us, public info)
│
├── /login
├── /register
│   ├── /register/role                     (role selection)
│   ├── /register/verify                   (phone OTP + email — account-level)
│   └── /register/trust-layer              (Landlord/Service Provider only)
│
├── /account                               (shared, authenticated)
│   ├── /account/profile
│   ├── /account/roles                     (per-role verification status + Role Switcher)
│   └── /account/roles/add                 (Add a Role)
│
├── /dashboard                             (resolves to the currently active role's dashboard)
│   │
│   ├── [Landlord]
│   │   ├── /dashboard/listings                    (My Listings)
│   │   ├── /dashboard/listings/new                (Post a Property)
│   │   ├── /dashboard/listings/[id]                (Listing Management Detail)
│   │   ├── /dashboard/subscription                 (Subscription/Billing)
│   │   └── /dashboard/messages                     (Tenant Messages inbox + /dashboard/messages/[threadId])
│   │
│   ├── [Tenant/Buyer]
│   │   ├── /dashboard/saved                        (Saved Homes)
│   │   └── /dashboard/messages                     (Messages inbox + /dashboard/messages/[threadId])
│   │
│   ├── [Service Provider]
│   │   ├── /dashboard/service-listing               (My Service Listing)
│   │   └── /dashboard/messages                       (Customer Messages inbox + /dashboard/messages/[threadId])
│   │
│   └── [Advertiser]
│       ├── /dashboard/ads                          (My Advertisements)
│       ├── /dashboard/ads/new                       (Submit Advertisement)
│       └── /dashboard/ads/[id]                      (Ad Detail / Payment)
│
├── /feedback                              (shared, authenticated)
├── /complaints                            (shared — access model TBD, see Readiness Check)
├── /listing/[id]/review                   (Ratings & Reviews submission, Tenant/Buyer)
│
└── /admin                                 (separate, non-public auth surface — PRD §6.8)
    ├── /admin/approvals
    ├── /admin/revenue
    ├── /admin/pricing
    ├── /admin/ratings-complaints
    ├── /admin/categories
    └── /admin/ads
```

---

## Information Architecture Readiness Check

**BLOCKER** — must be resolved before design exploration:

None identified.

**IMPORTANT** — should be resolved before implementation:

1. **Admin IA is only minimally scoped here.** PRD §6.8 requires an admin dashboard, but no journey-level detail exists for it (Admin was explicitly out of scope for the access-model and user-journey work). The 7 admin screens listed above are a direct restatement of PRD §6.8's bullet list, not a designed IA. Before Admin can move to design exploration, it likely needs its own journey-mapping pass.
2. **Complaints form access model is unclear.** PRD §8.3 doesn't explicitly state whether complaint submission requires authentication (unlike Feedback, which PRD §8.2 explicitly scopes to "any logged-in user"). This affects whether `/complaints` sits in the Public or Shared/Authenticated area of the sitemap.
3. All six IMPORTANT items already carried forward from USER_JOURNEYS.md remain open and now also affect IA directly:
   - Exact verification requirement for messaging (affects whether Tenant Messages/Customer Messages routes are reachable in a "pending" role-state, shown above as an open question in the relevant screen rows).
   - No defined timeframe for admin review — affects how the Pending Review screen communicates duration.
   - No defined resubmission mechanism for rejected items — affects whether Listing Management Detail / My Service Listing / Ad Detail need a distinct "resubmit" action or just "edit."
   - Effect of a lapsed Landlord subscription on an already-live listing — affects whether My Listings needs a distinct "at risk" state.
   - Advertiser pricing sequencing — affects whether Ad Detail/Payment is one screen or two sequential ones (submit, then later pay once terms are set).
   - Whether editing a live listing re-triggers admin re-review — affects the transition from Listing Management Detail back to a pending state.

**LATER** — can be resolved in a future iteration:

4. Whether rejection reasons are shown verbatim from Admin or generalized (carried from USER_JOURNEYS.md).
5. Whether Saved Homes has a count limit (carried from USER_JOURNEYS.md).
6. Exact contents of the Ratings & Reviews submission screen beyond star rating + short text (PRD gives minimal detail here).

---

None of the above are BLOCKER-level. Structural work for the four end-user-facing product areas (Public, Auth, Landlord, Tenant/Buyer, Service Provider, Advertiser) is complete and internally consistent with all upstream approved documents.

**INFORMATION ARCHITECTURE READY FOR DESIGN EXPLORATION.**
