# NextHome — Design System

**Status:** Design foundation — precedes component/wireframe planning. No components, wireframes, or code exist yet.
**Sources used:** `Next Home Brand Guidelines.pdf`, `NextHome_PRD_Phase1_Final.pdf`, [PRODUCT_UNDERSTANDING.md](PRODUCT_UNDERSTANDING.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [DESIGN_INTENT.md](DESIGN_INTENT.md), [USER_JOURNEYS.md](USER_JOURNEYS.md), [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md), [DESIGN_DIRECTIONS.md](DESIGN_DIRECTIONS.md).
**Selected direction:** Hybrid — Trust Ledger (structural foundation) + Neighborhood Welcome (visual/emotional influence for public discovery) + Working Marketplace (limited to dashboard/task efficiency). Priority order: **Trust and clarity → Warmth and approachable discovery → Efficient workflows.**

---

## 1. Design Philosophy and Visual Principles

The system is built on one governing idea: **trust is structural, warmth is contextual, efficiency is situational.**

- Trust (Direction A) is never optional and never decorative — it's the load-bearing layer present on every screen, in every state, for every role. It is the one thing that must never be traded away for warmth or density.
- Warmth (Direction B) is applied specifically where a human is making an emotional decision — primarily public discovery (homepage, search, listing detail) — and must never be allowed to visually bury a trust signal, a price, or a required action.
- Efficiency (Direction C) is applied specifically where a returning user is doing repeat, task-heavy work — dashboards, listing/message management — and must never spread into public-facing discovery screens, where it would undermine warmth, or become the default tone of the whole product.

**Five principles that follow directly:**

1. **Trust state is always visible, at every zoom level.** Whether a screen is warm (public) or dense (dashboard), the current verification/approval/subscription state relevant to what's shown is never hidden, minimized to a tiny icon, or requiring a hover/click to discover.
2. **One screen, one dominant tone.** A public discovery screen should feel unmistakably warm; a dashboard task screen should feel unmistakably efficient. Mixing both tones on one screen (e.g., a spacious editorial listing card inside a dense message-management table) creates visual incoherence — pick the tone that matches what the *user* is doing on that screen, not the direction that's "supposed" to be used there.
3. **Warmth is expressed through space and imagery, not through hiding information.** Generous whitespace and photography are Direction B's tools — they are never used to omit a fact (price, status, bedrooms) that Direction A requires to be shown.
4. **Density is expressed through layout efficiency, not through removing trust cues.** Direction C's compact grids and tables still carry explicit status columns/labels — density means smaller, tighter presentation of the same required facts, not fewer facts.
5. **One coherent visual language, not five mini-products.** Color palette, typography, spacing scale, and component shapes stay identical across all six product areas (Public, Auth, Landlord, Tenant/Buyer, Service Provider, Advertiser). Only *density and imagery emphasis* change by context — never the underlying visual grammar.

---

## 2. Color Usage and Semantic Color Roles

All base colors are taken directly from the Brand Guidelines (p.7–8). No new brand colors are introduced. Where the brand palette doesn't cover a functional need (status colors for success/warning/error), this is called out explicitly as a **proposed extension**, not a brand-approved value — see the note at the end of this section.

**Brand-sourced palette:**

| Name | Hex | Brand Role (per guidelines) |
|---|---|---|
| Deep Blue | `#1B537B` | Primary |
| Blue | `#0492C2` | Primary |
| Light Blue | `#5DCFFC` | Primary |
| Dark Blue | `#172A3A` | Secondary |
| Off-white | `#F0F7F7` | Secondary |
| Black | `#000000` | Secondary |
| White | `#FFFFFF` | Secondary |

**Semantic role mapping (structural, all sourced from the brand palette):**

| Semantic Role | Color | Usage |
|---|---|---|
| `surface-base` | White / Off-white | Default page and card background — warm, uncluttered, per Direction B |
| `surface-raised` | White | Cards, modals, elevated panels sitting on `surface-base` |
| `surface-dense` | Off-white (slightly stronger use in dashboards) | Dashboard table rows, dense list backgrounds — same color family, different application density (Direction C using Direction A/B's palette, never a new color) |
| `text-primary` | Dark Blue / Deep Blue | Headings, primary body copy, primary information |
| `text-secondary` | Deep Blue at reduced emphasis (via weight, not a new tint) | Supporting copy, captions |
| `brand-primary-action` | Blue | Primary buttons, primary links, active states — the single dominant action color per DESIGN_INTENT.md Principle 7 |
| `brand-primary-hover` | Deep Blue | Hover/pressed state of primary actions |
| `accent-highlight` | Light Blue | Sparingly — small highlights, active nav indicator, focus rings (never large fill areas, per Brand Guidelines "used sparingly" note) |
| `border-default` | Off-white/light neutral derived from Dark Blue at low opacity | Card borders, dividers |
| `logo-on-dark` | Off-white | Logo/text on Blue, Deep Blue, or Dark Blue backgrounds (brand rule: replace Blue with Off-white for contrast, Brand Guidelines p.5) |

**Proposed status-color extensions (NOT in the Brand Guidelines — flagged, not yet approved):**

The Brand Guidelines define no dedicated success/warning/error/danger colors. Since Direction A requires explicit, unambiguous state communication (Verified / Pending / Rejected / Subscription Inactive / Error), and DESIGN_INTENT.md §5 already flagged that "the exact destructive-action color is a system-level decision to make during component design... which the brand guideline does not define," this system proposes the following as a **minimal, brand-adjacent extension**, pending explicit sign-off:

| Proposed Role | Proposed Treatment | Rationale |
|---|---|---|
| `status-verified` | Blue (brand primary) + a checkmark glyph, not a new color | Reuses brand blue so "verified" reads as an affirmative brand-aligned state, not an arbitrary green |
| `status-pending` | Dark Blue at reduced weight/opacity + a distinct icon (clock/hourglass), not a new color | Keeps pending inside the brand palette while remaining visually distinct from "verified" through icon + weight, not hue |
| `status-rejected` / `status-error` | **Requires a genuinely new, non-brand color (e.g., a muted red/terracotta)** — a same-palette treatment cannot safely represent "something went wrong" without risking confusion with other states | Flagged as the one unavoidable gap — see Readiness Check |
| `status-success-confirmation` (e.g., "message sent," "listing published") | Blue (brand primary), same as `status-verified` | A successful action and a verified state are both affirmative brand moments; no separate color needed |

This is the single most important open item for a brand stakeholder to confirm before token implementation — see Readiness Check.

---

## 3. Typography Hierarchy

Two-weight system per Brand Guidelines p.9 — no third typeface is introduced.

| Level | Typeface/Weight | Usage |
|---|---|---|
| Display / Hero | Quicksand Bold, largest scale | Homepage hero headline only — used once per screen, at most |
| H1 | Quicksand Bold | Page-level titles (e.g., "Search Results," "My Listings") |
| H2 | Quicksand Bold | Section headings within a page |
| H3 | Quicksand Bold, smaller | Card titles, sub-section headings |
| Body | Quicksand Medium | Default paragraph/description copy |
| Body Small / Caption | Quicksand Medium, reduced size | Metadata, timestamps, helper text |
| Status / Label | Quicksand Bold, small size | Trust/state labels (Verified, Pending Review, etc.) — deliberately bold even at small size, so status competes visually with headings rather than disappearing into captions (Direction A requirement) |
| Price | Quicksand Bold | Always bold regardless of context — price is one of the two facts (with status) DESIGN_INTENT.md identifies as always immediately visible |

**Hierarchy rule specific to the hybrid:** on public/warm screens (Direction B), heading sizes can scale up generously (larger hero/H1 sizes, more line-height) to support the editorial feel. On dashboard/dense screens (Direction C), the same type scale is used but compressed toward its smaller end — never a different typeface or weight assignment, only a different point on the same scale. This keeps typographic language coherent across the hybrid per Principle 5.

---

## 4. Spacing and Layout Principles

A single spacing scale is shared everywhere; **context changes which increments get used most often, not the scale itself.**

- **Public/discovery screens (Direction B emphasis):** favor the larger end of the scale — generous card padding, wide gutters, breathing room around photography and around trust badges specifically (per DESIGN_INTENT.md §3's "generous spacing around identity/transaction elements").
- **Dashboard/management screens (Direction C emphasis):** favor the smaller-to-mid end of the same scale — tighter card/row padding, narrower gutters — but never so tight that a status label or primary action loses its own minimum clear space.
- **Trust-critical elements (Direction A, applies everywhere):** regardless of screen density, verification badges, pending-state banners, and payment/subscription messaging always receive a protected minimum spacing allowance so they can never be visually compressed to the point of being missed — this is a hard floor, not a suggestion, and applies even inside Direction C's dense layouts.

---

## 5. Grid and Responsive Behavior

- A standard responsive column grid underlies all screens (PRD §11.1 requires full responsiveness across phone, tablet, desktop).
- **Public discovery grids (Direction B):** fewer columns per breakpoint, larger card footprint — prioritizes fewer, more legible listings per view over raw quantity.
- **Dashboard/management grids (Direction C):** more columns/rows per breakpoint where content allows (e.g., My Listings, Messages inbox), prioritizing scanability of many items over generous per-item space — collapses gracefully to a single-column, still information-complete list on small viewports, never truncating status information to save space.
- Both grid modes share the same breakpoint set and the same underlying spacing tokens — only column count and card density differ.

---

## 6. Surface, Border, Radius, and Elevation Rules

- **Radius:** A single, consistently rounded corner radius is used across buttons, cards, inputs, and modals — echoing the rounded Quicksand letterforms and the logo's soft cloud motif (Direction B influence), applied uniformly rather than only on "warm" screens, so the product doesn't feel like it's switching design systems between public and dashboard areas (Principle 5).
- **Borders:** Used more in dense/dashboard contexts (Direction C) to separate compact rows/cells without relying purely on spacing; used more sparingly in public/warm contexts (Direction B), where whitespace alone typically separates content.
- **Elevation (shadow):** Reserved for genuinely elevated content — modals, dropdowns, the auth-intercept overlay — never used decoratively on standard cards or dashboard rows. Consistent with DESIGN_INTENT.md's anti-decoration stance: elevation communicates layering/hierarchy, not visual flourish.
- **Surfaces:** `surface-base` (Off-white/White) is the default everywhere. Dashboards may use a subtly distinct `surface-dense` treatment (still from the same palette) to visually separate the "working" area from the lighter public/marketing chrome, reinforcing the public-vs-authenticated distinction required by DESIGN_INTENT.md §4 without introducing new colors.

---

## 7. Trust and Status Communication Patterns

This is Direction A's core contribution and applies identically across every product area.

- **One state, one explicit label, always.** Every trust-relevant item (a listing, a service listing, an ad, a role, an account) shows exactly one current state from its defined set (per PRODUCT_DECISIONS.md's account/role/content-item layering) — never inferred from color alone, never blended with another state.
- **Icon + label + (where relevant) brief explanation**, not icon alone and not label alone. E.g., "Pending Review — your documents are being checked" rather than just a clock icon or just the word "Pending."
- **Status is never smaller or lower-contrast than surrounding content** it applies to — it can be visually integrated (a badge inline with a card title, not a separate compliance block) but never minimized.
- **Distinct state layers stay visually distinct.** Account-level, role-level, and content-item-level states (PRODUCT_DECISIONS.md §6) must never share one generic "status" treatment that a user could misread as referring to the wrong layer — e.g., a Landlord's role-verification status and a specific listing's approval status need visually distinguishable presentation even when shown near each other (e.g., in Account/Profile vs. My Listings).
- **Integrated, not bureaucratic:** on public/warm screens, the Verified badge is a natural part of the card's visual composition (e.g., placed consistently near the title/price, styled with the same rounded, brand-colored treatment as other UI) — not a boxed, form-like compliance stamp. This is the specific instruction from the hybrid brief ("do not make every screen look bureaucratic") — trust is structurally required everywhere, but its *expression* should still feel like part of a warm product on public/warm screens, and can be more explicitly labeled/tabular on dense dashboard screens where users expect and want that clarity.

---

## 8. Buttons and Action Hierarchy

Directly extends DESIGN_INTENT.md §5:

- **Primary action:** filled, `brand-primary-action` (Blue) — exactly one per screen/section. Examples: Message Landlord, Post a Property, Subscribe, Save Home (only when nothing more primary is present on that specific view).
- **Secondary action:** outlined or text-only, Deep Blue or neutral — Cancel, Edit, View Details, Back.
- **Destructive/irreversible action:** visually distinct from both of the above — uses the proposed `status-rejected`/error color (see §2 gap), never brand blue, and always requires a confirmation step for anything not trivially reversible (unpublish a listing, remove a review, delete account).
- **Density adaptation (Direction C):** in dashboard contexts, buttons may shrink in size/padding to fit denser layouts, but never change their color-coded hierarchy — a primary button is still the only filled Blue button in its section, however compact.
- **Warmth adaptation (Direction B):** on public/discovery screens, the primary CTA (typically "Message Landlord" or "Post a Property") may be given more visual prominence (larger size, more surrounding space) than its dashboard counterpart, without changing its underlying color role.

---

## 9. Forms and Input Principles

- Inputs share one consistent visual treatment (border, radius, focus state using `accent-highlight`) across every form in the product — registration, listing creation, ad submission, messaging.
- **Registration forms adapt in length, not in visual style**, per role (PRODUCT_DECISIONS.md §5): Tenant/Buyer and Advertiser forms are short (phone, email, OTP); Landlord/Service Provider forms add mother's maiden name and document upload as additional, clearly-labeled steps — never presented as one long undifferentiated form, but as a short, explicit checklist-style flow (DESIGN_INTENT.md §3 "approachable" translation).
- **Document upload controls** are only ever shown to Landlord/Service Provider roles, never rendered (even in a disabled state) for Tenant/Buyer or Advertiser flows — this is a hard rule tied directly to PRODUCT_DECISIONS.md §5, not a visual preference.
- **Payment/subscription forms** follow Direction A's transparency requirement above all: cost, billing cadence, and payment method are stated in plain text before any payment control is interactive — this is the one form category where warmth/brevity must yield to explicitness.
- **Inline validation** is immediate and specific (e.g., "Enter a valid Nigerian phone number," not "Invalid input"), consistent with DESIGN_INTENT.md §7's error-handling principle.

---

## 10. Navigation Principles

Directly implements INFORMATION_ARCHITECTURE.md's Navigation section:

- **Global public nav** stays warm and simple (Direction B) — Rent/Sale toggle, Browse, Services, Post Property CTA, Help — never densified, regardless of how dense the authenticated areas get.
- **Authenticated account/role area** (account menu, role switcher, dashboard entry) sits alongside — not replacing — the same public nav, preserving one coherent navigation system rather than two separate ones per Principle 5 / IA's "shared vs. role-specific areas" rule.
- **Dashboard sub-navigation** (My Listings, Messages, etc.) may adopt Direction C's denser, more compact treatment (e.g., a persistent sidebar rather than a spacious top nav) once inside a role's dashboard — but the transition from public nav to dashboard nav should still feel like moving deeper into the same product, not switching apps (echoing DESIGN_INTENT.md's anti-pattern against role-switching feeling like "logging into a different app").
- **Role switcher and per-role verification status** live together in the account area (per IA), using Direction A's explicit-state pattern (§7 above) regardless of which screen the user switches from.

---

## 11. Cards and Listing Presentation Rules

The most direct point of tension/synthesis between all three directions — resolved as follows:

- **Public listing/service/ad cards (Direction B primary, Direction A non-negotiable floor):** photography-led, generous padding, but every card still shows, without exception: price, location, bedroom count (if property), and an explicit, legible Verified/status indicator (PRD §4; DESIGN_INTENT.md Principle 1). The photo leads visually; the facts are never omitted or demoted below a "learn more" interaction — this satisfies the hybrid brief's explicit rule that "visual warmth must never hide important trust information, property facts, or user actions."
- **Dashboard listing/management rows (Direction C primary, Direction A non-negotiable floor):** compact, table-like or list-like treatment, smaller or no photography, explicit status column/label always present and never abbreviated to just a color dot.
- **Consistent card anatomy across contexts:** the same fields appear in the same relative order (status → primary facts → primary action) whether the card is large/public or compact/dashboard — only scale and imagery emphasis change, not structure, which keeps the product feeling like one coherent system per Principle 5.
- **Ad cards must remain visually distinguishable from organic listings** at all times, in both public and dense contexts, per DESIGN_INTENT.md's explicit anti-pattern warning — a clear "Sponsored"/"Advertisement" label, styled consistently, on every ad card regardless of density.

---

## 12. Dashboard vs. Public Experience Differences

| Aspect | Public / Discovery | Dashboard / Management |
|---|---|---|
| Dominant direction | B (warmth) on top of A (trust floor) | C (efficiency) on top of A (trust floor) |
| Density | Low–medium, generous spacing | Medium–high, compact |
| Imagery | Leading visual element | Secondary/thumbnail |
| Navigation | Simple, top-level, always visible | Denser, role-specific sub-navigation |
| Primary content unit | Large card, editorial | Compact row/card, tabular-leaning |
| Status presentation | Integrated badge, warm styling | Explicit label/column, higher information density |
| Tone of copy | Inviting, conversational | Direct, task-focused |

Both experiences share: identical color tokens, identical typography scale, identical corner radius, identical primary/secondary/destructive action logic, and identical trust-communication rules (§7) — the difference is emphasis and density, never the underlying system, satisfying the hybrid brief's rule against creating "visually separate mini-products for each role."

---

## 13. Modal, Drawer, Dropdown, and Overlay Behavior

- **Authentication intercept modal:** opens in place over the triggering context (PRODUCT_DECISIONS.md §9), uses `surface-raised` + elevation, anchors visually near its trigger point (DESIGN_INTENT.md §8 motion principle) rather than appearing centrally detached.
- **Confirmation dialogs** (for destructive/irreversible actions): always modal (blocking), never a dismissible toast, and always name the specific consequence ("Unpublish this listing? It will no longer be visible to tenants.").
- **Dropdowns** (role switcher, account menu, filters on smaller viewports): lightweight, non-blocking, dismiss on outside click/escape, consistent focus/keyboard behavior (see Accessibility, §15).
- **Drawers** (e.g., mobile filter panel replacing Direction A's persistent desktop filter sidebar): used specifically for the responsive collapse of persistent public-browsing filters on small viewports — not introduced elsewhere as a general pattern, to avoid proliferating overlay types.
- All overlays share the same corner radius, elevation, and color tokens as the rest of the system (Principle 5) — no overlay-specific visual language.

---

## 14. Loading, Empty, Error, Success, Pending, Rejected, and Blocked States

Each state gets a distinct, named treatment — never collapsed into a generic spinner or generic message, per DESIGN_INTENT.md §7:

| State | Pattern |
|---|---|
| **Loading** | Explicit loading indicator on any network-dependent action (search filtering, submission, payment) — never a silently unresponsive UI |
| **Empty** | Specific, context-aware empty state per screen (e.g., "No saved homes yet — browse listings to save your favorites," not a generic "Nothing here") |
| **Error** | Plain-language, specific to the failure; uses the proposed error/status-rejected color (§2); never a raw technical/system error string |
| **Success** | Specific confirmation naming what happened and, where relevant, what's next ("Your listing has been submitted for review," not "Success!") |
| **Pending** | First-class, persistent state (not a toast) — explains what's being waited on (admin document review, listing content review, ad review); visually distinct from both Verified and Rejected, never a color-only distinction |
| **Rejected** | Names that the item was rejected, and — pending resolution of the open question in USER_JOURNEYS.md/INFORMATION_ARCHITECTURE.md Readiness Checks about resubmission — provides whatever next step is eventually defined; must never look identical to "Pending" |
| **Blocked (gated action)** | Names the specific unmet condition (not authenticated / not role-verified / not subscribed) per DESIGN_INTENT.md Principle 2 — never a generic "you can't do that" |

---

## 15. Accessibility Requirements

- All color-coded state distinctions (§7, §14) are paired with icon and/or text — never color alone (directly required since the proposed status palette leans on a small set of hues that must remain distinguishable for color-blind users).
- Full keyboard operability for all interactive elements, including the auth-intercept modal, role switcher, and filter controls.
- Focus states use `accent-highlight` (Light Blue) consistently and visibly — never suppressed for aesthetic reasons.
- Sufficient contrast maintained between text and surface colors in both the warm/spacious (Direction B) and dense (Direction C) contexts — particularly important given Off-white surfaces and Light Blue accents, which need contrast verification against body text.
- All imagery (a Direction B emphasis) requires meaningful alt text — photography must not become an accessibility blind spot in pursuit of warmth.
- Motion respects `prefers-reduced-motion` system-wide (detailed in §16) — no exceptions per screen or direction.

---

## 16. Motion Principles (including Reduced-Motion Behavior)

Inherits DESIGN_INTENT.md §8 in full; the hybrid direction adds only emphasis guidance:

- **Public/discovery screens (Direction B):** motion may be slightly warmer/softer in easing (e.g., a gentle save-confirmation animation) but must remain purely functional in *purpose* — communicating state change, never decoration for its own sake.
- **Dashboard screens (Direction C):** motion is fast and minimal — state changes register near-instantly, prioritizing task speed over expressiveness.
- **Trust-related state changes (Direction A):** regardless of screen context, a state transition (pending → verified, submitted → approved) always gets a clear, one-time acknowledgment — never silent, never purely decorative, never motion-only (always paired with a static label change, per DESIGN_INTENT.md §8's "screenshot must be understandable" rule).
- **Reduced motion:** when `prefers-reduced-motion` is set, all transitions reduce to instant/near-instant state changes with no easing or movement, across every screen in every direction-emphasis context — no exceptions, and no information is ever lost, only the transition animating it.
- Motion library (Motion) remains uninstalled and unused at this stage, per explicit instruction — these are governing principles only.

---

## 17. Explicit Anti-Patterns to Avoid

In addition to the anti-patterns already listed in DESIGN_INTENT.md §9 (which remain fully in force), the hybrid direction introduces these additional, hybrid-specific anti-patterns:

- **Applying Direction A's compliance-form aesthetic to public screens.** A homepage or listing detail page that looks like a bureaucratic form fails the hybrid brief directly.
- **Applying Direction B's spacious editorial aesthetic to dense dashboards.** A Landlord with 40 listings should not have to scroll through large, sparse cards to manage them — that fails the "efficient workflows" priority.
- **Applying Direction C's density to public discovery.** Cramped, table-like search results would undermine the "warm enough to make people want to explore" goal — density is reserved for authenticated task screens only.
- **Letting warmth hide a fact.** Any pattern where a large hero photo pushes price, status, or the primary action below an initial viewport fold on a listing card is a direct violation of the hybrid's stated priority order (trust/clarity first).
- **Letting efficiency hide a fact.** Any dense dashboard pattern that abbreviates status to a color-only dot, or omits it to save row height, is an equally direct violation.
- **Creating role-specific visual sub-brands.** Each role's dashboard must feel like a different *room* in the same house, not a different house — divergent color palettes, type treatments, or component shapes per role are explicitly disallowed.
- **Treating the Verified badge or any status label as a purely decorative brand flourish.** It is functional information first; brand styling (color, shape, type) makes it feel native to the product, but never at the cost of legibility or prominence.

---

# DESIGN_TOKENS (Proposed Categories and Naming Convention — Not Yet Implemented)

This section defines the *shape* of the token system for future implementation. No code, config, or actual token files are created at this stage.

**Naming convention:** `{category}-{role}-{variant?}` (kebab-case), e.g. `color-brand-primary`, `space-card-padding-dense`, `radius-control-default`.

### Color Tokens
- `color-brand-primary` (Blue `#0492C2`)
- `color-brand-primary-hover` (Deep Blue `#1B537B`)
- `color-brand-accent` (Light Blue `#5DCFFC`)
- `color-surface-base` (Off-white `#F0F7F7`)
- `color-surface-raised` (White `#FFFFFF`)
- `color-surface-dense` (Off-white, dashboard-context variant)
- `color-text-primary` (Dark Blue `#172A3A`)
- `color-text-secondary` (Deep Blue `#1B537B`, reduced-emphasis usage)
- `color-text-on-dark` (Off-white, per brand contrast rule)
- `color-border-default`
- `color-status-verified` (mapped to `color-brand-primary`)
- `color-status-pending` (mapped to `color-text-primary` at reduced weight + icon)
- `color-status-rejected` / `color-status-error` **(pending brand sign-off — see §2 gap)**
- `color-status-success` (mapped to `color-brand-primary`)
- `color-focus-ring` (mapped to `color-brand-accent`)

### Typography Tokens
- `font-family-primary` (Quicksand)
- `font-weight-bold` / `font-weight-medium`
- `type-display`, `type-h1`, `type-h2`, `type-h3`, `type-body`, `type-body-small`, `type-status-label`, `type-price`
- Each `type-*` token bundles size + line-height + weight as one unit, with a `-dense` variant for dashboard-context compression (e.g., `type-h1-dense`)

### Spacing Tokens
- `space-1` through `space-8` (base scale, smallest to largest)
- `space-card-padding-warm` (large end of scale, public/discovery use)
- `space-card-padding-dense` (small–mid end of scale, dashboard use)
- `space-status-min-clearance` (protected minimum around trust/status elements — a floor value, not overridable by density context)

### Radius Tokens
- `radius-control-default` (buttons, inputs)
- `radius-card-default`
- `radius-modal-default`
- One shared scale — no per-direction radius variants, per Principle 5

### Elevation Tokens
- `elevation-none` (default card/row state)
- `elevation-raised` (modals, dropdowns, auth-intercept overlay)

### Motion Tokens
- `motion-duration-instant`, `motion-duration-short`, `motion-duration-standard`
- `motion-easing-functional` (dashboard/state-change use)
- `motion-easing-warm` (public/discovery use, per §16)
- `motion-reduced` (system-wide override honoring `prefers-reduced-motion`)

### Layout/Grid Tokens
- `grid-columns-public-{breakpoint}`
- `grid-columns-dashboard-{breakpoint}`
- `breakpoint-mobile`, `breakpoint-tablet`, `breakpoint-desktop` (aligned to PRD §11.1's required device range)

---

## Design Foundation Readiness Check (Design System portion)

Carried into the combined check at the end of SCREEN_BLUEPRINTS.md below.
