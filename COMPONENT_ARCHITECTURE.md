# NextHome — Component Architecture

**Status:** Component planning — precedes wireframes and code. No components exist yet.
**Sources used:** all prior approved documents, primarily [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [SCREEN_BLUEPRINTS.md](SCREEN_BLUEPRINTS.md), [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md).

**Carried-forward IMPORTANT items** (from SCREEN_BLUEPRINTS.md's Readiness Check — repeated here as implementation notes, not resolved): status color extension needs brand sign-off; Admin screens minimally blueprinted; Complaints form access model unclear; exact messaging verification gate unclear; no defined review/resubmission timeframe; lapsed-subscription effect on live listings undefined; Advertiser pricing sequencing unclear; whether editing a live listing re-triggers review is unstated. Each is flagged again inline wherever it affects a specific component.

Guiding rule for this document: **build only what SCREEN_BLUEPRINTS.md actually requires.** A component is included because multiple documented screens need it, not because it sounds like a reasonable abstraction. Where a component looks reusable but isn't (yet) called for by more than one screen, it's explicitly named as **not to be over-generalized** rather than built as a flexible primitive prematurely.

---

## 1. Design Primitives

Lowest-level, style-only building blocks. Shared everywhere (DESIGN_SYSTEM.md Principle 5) — never role- or context-specific.

| Component | Purpose | Used In | Required Variants | Important States | Shared/Role-Specific |
|---|---|---|---|---|---|
| **Button** | All user-initiated actions | Every screen | Primary (filled, Blue), Secondary (outlined), Destructive (error color), Text/Link | default, hover, pressed, disabled, loading | Shared |
| **Input (text/number)** | Form data entry | Registration, listing forms, ad forms, messages, feedback/complaints | text, number, textarea | default, focus, error, disabled | Shared |
| **Select / Dropdown** | Fixed-choice entry (state, bedrooms, category) | Search filters, listing forms, service category | single-select | default, open, error, disabled | Shared |
| **OTP Input** | Phone verification code entry | Registration (Basic Info & OTP step) | 4–6 digit segmented | default, error, verified | Shared |
| **File Upload** | Document/photo upload | Trust Layer document upload, listing photos, ad creative | single-file (document), multi-file (photos) | idle, uploading, uploaded, error | Shared — **but the document-upload variant must only ever render inside Landlord/Service Provider flows** (PRODUCT_DECISIONS.md §5); this is a hard usage rule, not a variant to expose generally |
| **Typography** (Display/H1/H2/H3/Body/Caption/StatusLabel/Price) | Text rendering per DESIGN_SYSTEM.md §3 scale | Everywhere | one component per scale level, or a single `Text` primitive with a `level` prop | — | Shared |
| **Icon** | Small symbolic graphics (status icons, nav icons) | Everywhere | fixed icon set only — no ad hoc one-off icons | — | Shared |
| **Badge / Status Pill** | Compact labeled state indicator | Trust/verification, listing status, ad status | Verified, Pending, Rejected, Sponsored/Ad | — | Shared — **color mapping depends on the unresolved status-color extension (DESIGN_SYSTEM.md §2); build with a token reference, not a hardcoded hex, so the pending brand decision doesn't require a rewrite** |
| **Avatar** | User/account representation | Message threads, account area | image, initials-fallback | — | Shared |
| **Loader / Spinner** | In-progress network action | Any async action | inline (button), full-section | — | Shared |
| **Checkbox / Toggle** | Binary choice | Filters, settings | — | default, checked, disabled | Shared |

---

## 2. Shared Components

Composed from primitives; used across multiple product areas but not tied to one role.

| Component | Purpose | Used In | Required Variants | Important States | Shared/Role-Specific |
|---|---|---|---|---|---|
| **Global Header** | Primary navigation, brand presence | Every public and authenticated screen | unauthenticated (Login/Register), authenticated (account menu) | — | Shared |
| **Footer** | Secondary links (Help, legal, etc.) | Every public screen | — | — | Shared |
| **Search Bar + Mode Toggle** | Rent/Sale search entry | Homepage, Search Results | compact (header-embedded), full (homepage hero) | — | Shared |
| **Filter Panel** | Search refinement (state, price, bedrooms, duration tag) | Search Results | persistent sidebar (desktop), drawer (mobile — see RESPONSIVE_STRATEGY.md) | applied, empty | Shared |
| **Auth Prompt Modal** | Intercept protected-action attempts (PRODUCT_DECISIONS.md §9) | Any gated action, any role | login-default, register-default (role pre-selected) | — | Shared |
| **Role Switcher** | Change active role context | Account/Profile area | dropdown or list, showing all held roles + their states | active, inactive-role, role-pending | Shared (only appears for multi-role accounts) |
| **Empty State** | "Nothing here yet" pattern | Saved Homes, My Listings, Messages, My Advertisements, Search Results (zero matches) | icon+message, icon+message+CTA | — | Shared — **must NOT be one generic "Nothing here" component; each usage requires its own specific copy per DESIGN_SYSTEM.md §14, so this is a layout/style primitive that always takes explicit content props, never a default message** |
| **Error State** | Plain-language failure display | Any failed action | inline (form field), block (page/section) | — | Shared |
| **Confirmation Dialog** | Blocking confirmation for destructive/irreversible actions | Unpublish listing, remove review, delete account | — | — | Shared |
| **Toast / Inline Success Confirmation** | Specific success feedback | Message sent, home saved, listing submitted | — | — | Shared — copy is always action-specific (DESIGN_SYSTEM.md §14), never a generic "Success!" |
| **Status Banner** | Persistent, non-dismissible state communication | Pending review, subscription inactive, blocked action | pending, rejected, blocked, subscription-inactive | — | Shared — this is the direct implementation of DESIGN_SYSTEM.md §7 and §14's "one explicit state, always" rule |
| **Message Thread List / Message Composer** | Inbox and conversation UI | Landlord/Tenant/Service Provider messaging | list item, thread view, composer | unread, empty, sending | Shared — same component reused across all three roles' messaging (only data differs), per Principle 5 |
| **Pagination / Load More** | Result set navigation | Search Results, My Listings, My Advertisements | — | — | Shared |

---

## 3. Property Components

Specific to Rent/Sale listing presentation. Used across Public and Landlord areas (different density modes per DESIGN_SYSTEM.md §12).

| Component | Purpose | Used In | Required Variants | Important States | Shared/Role-Specific |
|---|---|---|---|---|---|
| **Property Card** | Compact listing summary for grids/lists | Search Results, Saved Homes, Homepage, My Listings (dashboard-density variant) | `public` (warm, Direction B), `dashboard` (dense, Direction C) — same anatomy, different scale/imagery emphasis per DESIGN_SYSTEM.md §11 | live, pending, rejected | Shared |
| **Property Image Gallery** | Full photo browsing on detail page | Listing Detail, Listing Management Detail | thumbnail strip + main image | loading, single-photo fallback | Shared |
| **Property Summary** | Core facts block (price, location, bedrooms, type) | Listing Detail, Listing Management Detail, Property Card (compact form) | full (detail page), compact (card) | — | Shared |
| **Property Facts List** | Extended description/details | Listing Detail | — | — | Public-only (not needed in dashboard density) |
| **Trust/Verification Indicator** | Verified/Pending badge, integrated per DESIGN_SYSTEM.md §7 | Property Card, Listing Detail, Service Provider Detail/Card | inline-badge (public, warm-integrated), label-column (dashboard, explicit) | verified, pending, rejected | Shared — built on the Badge primitive but with the two density-specific presentation modes required by the hybrid direction |
| **Listing Status Indicator** (content-item-level) | Landlord-facing pending/live/rejected state, distinct from role-level verification | My Listings, Listing Management Detail | — | pending, live, rejected | **Landlord/Service Provider only** (their listings) — not shown on public cards, which use Trust/Verification Indicator instead; these two components must stay visually distinct per PRODUCT_DECISIONS.md §6's account/role/content-item layering |
| **Contact/Message Action** | Entry point into gated messaging | Listing Detail, Service Provider Detail | button (dominant CTA styling) | authenticated, gated (triggers Auth Prompt Modal) | Shared |
| **Save/Unsave Control** | Toggle for Saved Homes | Property Card, Listing Detail | — | saved, unsaved, gated | **Tenant/Buyer only** — must not render for other roles browsing publicly (a Landlord viewing another listing has no defined save behavior in the PRD; not introduced here) |
| **Short-Term/Long-Term Filter Tag** | Rent-mode duration filter | Search Results (Rent mode), Property Card (Rent listings) | — | — | Shared, Rent-mode only — **not a separate listing type or field set, per PRD §14; this must remain a lightweight tag component, not a structural variant of Property Card** |

---

## 4. Dashboard Components

Shared shell/structure across all four authenticated roles — role-specific content is injected, the shell itself is not duplicated per role (Principle 5, avoiding "visually separate mini-products").

| Component | Purpose | Used In | Required Variants | Important States | Shared/Role-Specific |
|---|---|---|---|---|---|
| **Dashboard Shell** | Consistent authenticated-area frame (nav + content area) | Every dashboard screen, all roles | — | — | Shared |
| **Dashboard Sidebar/Nav** | Role-specific sub-navigation (My Listings, Messages, etc.) | Every dashboard screen | content varies per active role; structure identical | active-item highlight | Shared structure, role-specific content (data-driven, not a separate component per role) |
| **Summary/Attention Panel** | Surfaces pending/urgent items first (DESIGN_SYSTEM.md §12) | Every dashboard home screen | — | has-urgent-items, all-clear | Shared |
| **Management List/Table** | Dense listing of owned items (listings, ads, service listing) | My Listings, My Advertisements, My Service Listing | list (fewer items), table (many items, Direction C density) | — | Shared — **not role-specific**; differs only in the data columns bound to it, not in structure |
| **Action Panel** | Grouped primary/secondary actions for a management item | Listing Management Detail, Ad Detail | — | — | Shared |
| **Account/Verification Status Panel** | Per-role verification + subscription state display | Account/Profile, Dashboard home | account-level row, per-role rows | verified, pending, subscription-inactive, subscription-active | Shared — this is the component that must visually separate account-level vs. role-level state (PRODUCT_DECISIONS.md §6); **do not collapse into one generic "status" list** |

---

## 5. Role-Specific Components

Only components with no reuse case elsewhere — kept minimal deliberately.

### Landlord
| Component | Purpose | Variants | States |
|---|---|---|---|
| **Post a Property Form** | Multi-step listing creation (address, price, bedrooms, description, photos, Rent/Sale type, duration tag) | Rent step-set, Sale step-set (one-time price instead of recurring) | draft, submitting, submitted |
| **Subscription/Billing Panel** | Pricing display + payment method selection + payment form | card/Paystack (instant), bank transfer (delayed) | inactive, processing, active, pending-confirmation (bank transfer) |
| **Listing Performance View** | View count display | — | has-data, no-data-yet |

### Tenant/Buyer
No role-exclusive components beyond what's already covered by Property Components (Save/Unsave Control) and Shared Components (Message Thread List). This is deliberate — the Tenant/Buyer experience is the lightest of the four roles per PRODUCT_DECISIONS.md, and inventing dedicated components here would contradict that.

### Service Provider
| Component | Purpose | Variants | States |
|---|---|---|---|
| **Service Listing Form** | Category selection, description, contact details, photos | — | draft, submitting, submitted |
| **Service Category Selector** | Admin-managed category picker (PRD §6.7) | — | populated, empty (no categories — Admin-side concern, unlikely but should degrade gracefully) |

### Advertiser
| Component | Purpose | Variants | States |
|---|---|---|---|
| **Ad Submission Form** | Image, text, link fields | — | draft, submitting, submitted |
| **Ad Terms/Payment Panel** | Placement, duration, cost display + payment | — | pending-terms (before admin sets terms — sequencing unresolved, see note below), terms-set, paid | **The exact structure of this component (one screen vs. two sequential states) depends on the unresolved Advertiser pricing sequencing question (SCREEN_BLUEPRINTS.md Readiness Check item 7) — build the "pending-terms" state explicitly so the component doesn't assume terms are always known at submission time.** |

---

## 6. State Components

Reusable *patterns*, not necessarily single components — each concrete instance (Empty State, Error State, Status Banner from §2) is bound with screen-specific content. This section documents the pattern rules that govern all of them, per DESIGN_SYSTEM.md §14.

| State | Pattern Rule | Built From |
|---|---|---|
| **Loading** | Explicit indicator on any network-dependent action; never a silently unresponsive UI | Loader primitive, inline or block |
| **Empty** | Always screen-specific copy + (where relevant) a CTA back to the relevant action | Empty State (§2) |
| **Error** | Plain-language, specific to the failure; uses the proposed error/status-rejected color pending brand sign-off | Error State (§2) |
| **Success** | Names what happened and what's next, never generic | Toast/Inline Success Confirmation (§2) |
| **Pending** | First-class, persistent (not a toast); explains what's being waited on; distinct from Rejected | Status Banner (§2) — **duration messaging depends on the unresolved admin-review-timeframe item; build the copy slot generically enough to state a timeframe once defined, without assuming one now** |
| **Rejected** | Explicit, visually distinct from Pending; next-step content depends on the unresolved resubmission-mechanism item — **build the component with a "next step" content slot that can be empty/generic today and filled in once that product decision is made, rather than hardcoding an assumed resubmission flow** | Status Banner (§2) |
| **Blocked (gated action)** | Names the specific unmet condition (not authenticated / not role-verified / not subscribed) | Status Banner (§2) or inline variant near the blocked action |
| **Subscription Inactive** | Distinct from both Pending and Rejected — a Landlord-specific state naming the missing subscription requirement directly | Status Banner (§2), Landlord-specific content |

**Explicit non-goal:** these are not proposed as one single "StateMessage" mega-component with a `type` enum covering all eight cases — DESIGN_SYSTEM.md §14 and §7 both require these to remain visually and semantically distinct (never a single generic treatment differentiated only by color), so implementation should keep Pending/Rejected/Blocked/Subscription-Inactive as intentionally distinguishable presentations sharing the same underlying Status Banner *pattern*, not the same component instance with only a color swapped.

---

## Components Explicitly Flagged: Do Not Over-Generalize

- **File Upload** — resist building one fully generic "any file, any context" uploader with configurable everything; the document-upload use case (Landlord/Service Provider Trust Layer) has a hard role restriction that must not become just another prop/variant indistinguishable from photo upload.
- **Empty State / Error State / Toast** — resist collapsing these into one "Message" component differentiated by a `type` prop with default copy; every instance needs explicit, screen-specific content per DESIGN_SYSTEM.md §14, and a shared generic component invites default/generic copy over time.
- **Property Card `public`/`dashboard` variants** — resist merging these into one infinitely configurable card with size/density props; keep them as two clearly named variants of one anatomy (per DESIGN_SYSTEM.md §11) so the hybrid direction's public-vs-dashboard tone boundary (§1's Principle 2) stays enforced structurally, not just by convention.
- **Management List/Table** — resist making this a fully generic data-table component reused for anything tabular in the future (e.g., Admin screens, which aren't designed yet); scope it now to the three known use cases (My Listings, My Advertisements, My Service Listing) and revisit generalization only once Admin's own component needs are actually defined.
- **Trust/Verification Indicator vs. Listing Status Indicator** — resist merging these two into one "status badge" component; they represent different state layers (role-level vs. content-item-level, PRODUCT_DECISIONS.md §6) and collapsing them risks exactly the state-layer confusion DESIGN_SYSTEM.md §7 warns against.
