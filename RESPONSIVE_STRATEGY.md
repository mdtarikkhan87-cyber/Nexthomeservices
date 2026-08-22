# NextHome — Responsive Strategy

**Status:** Responsive planning — precedes code. No implementation exists yet.
**Sources used:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) §5/§15, [WIREFRAME_PLAN.md](WIREFRAME_PLAN.md), `NextHome_PRD_Phase1_Final.pdf` §11.1 (fully responsive — phone, tablet, desktop is a stated PRD requirement, not a design preference).

---

## Desktop-First vs. Mobile-First Reasoning

**Mobile-first**, for three reasons grounded directly in the source documents rather than general convention:

1. The PRD's target users (landlords, tenants, service providers in a market where Paystack/mobile-money and phone-OTP verification are primary infrastructure, PRD §7) skew toward mobile as a primary, not secondary, access pattern.
2. Several critical flows are inherently short, linear, and already well-suited to mobile-first construction: phone OTP entry, document photo upload (Basic Trust Layer), and the Message composer — all of these are naturally mobile-native interactions (camera access, numeric keypad) that are easy to scale *up* to desktop but awkward to design desktop-first and scale *down*.
3. DESIGN_SYSTEM.md's hybrid direction depends on density being the *exception* (dashboards) and spaciousness being the *default* (public/discovery, Direction B) — mobile-first construction naturally forces designing the spacious, single-column, priority-ordered version first, which is also the harder-to-get-right version; the denser desktop dashboard layouts are comparatively easier to build up from that foundation than the reverse.

Mobile-first here means: build and validate the single-column, full-width, top-to-bottom priority order defined in WIREFRAME_PLAN.md first, then layer in multi-column/denser treatments at larger breakpoints — not that desktop is an afterthought.

---

## Breakpoint Strategy

No arbitrary breakpoint set is invented here. The PRD's only explicit requirement is device-class coverage — "phone, tablet, and desktop" (PRD §11.1) — so three breakpoint tiers map directly to that requirement, with values chosen from common device viewport boundaries rather than an arbitrary numeric scheme:

| Tier | Maps to PRD device class | Primary structural behavior |
|---|---|---|
| **Compact** | Phone | Single column everywhere; Filter Panel and Dashboard Sidebar become drawers/overlays; Property Card grid is 1-per-row |
| **Medium** | Tablet | 2-column grids where content allows (Property Card grid, My Listings); Filter Panel may remain a drawer or become a collapsible inline panel; Dashboard Sidebar may become a top tab bar rather than a full drawer |
| **Wide** | Desktop | Multi-column grids (3+ Property Cards per row where DESIGN_SYSTEM.md §5's public-grid rules apply); persistent Filter Panel and Dashboard Sidebar, no drawers needed |

Exact pixel values are an implementation-time decision (tied to whatever CSS framework choice is made during scaffolding — out of scope for this document, which defines behavior, not tokens) but must resolve to exactly these three tiers, matching the PRD's stated requirement — not a finer-grained scheme invented for its own sake.

---

## Navigation Transformation

- **Compact (phone):** Global Header collapses to a logo + menu control; the Rent/Sale search/mode toggle remains visible (it's the PRD's stated "first thing a visitor sees and uses," §4) rather than being hidden behind the menu. Dashboard Sidebar becomes a bottom tab bar or a top horizontal scroll nav (per WIREFRAME_PLAN.md) — chosen for one-handed reachability of the role's core loop (DESIGN_INTENT.md §5).
- **Medium (tablet):** Global Header may show more items inline before collapsing (Browse Rent/Sale, Services) with only secondary items (Help, full account menu) behind a control. Dashboard Sidebar can remain a compact persistent rail if width allows, or stay as a tab bar — a per-role-density judgment call at implementation time, not a structural requirement here.
- **Wide (desktop):** Full Global Header, all items inline. Dashboard Sidebar persistent, full-width labels (not icon-only).
- **Constant across all tiers:** the account menu / role switcher location (Account/Profile area, per PRODUCT_DECISIONS.md §8) never moves to a different conceptual location — it collapses/expands, but role switching is always reachable from the same place, satisfying DESIGN_SYSTEM.md §10's "coherent navigation system" rule regardless of viewport.

---

## Property Card Transformation

- **Compact:** Single column, full-width card; photo takes a fixed aspect-ratio band at top; Trust/Verification Indicator + price remain co-located immediately below the photo (never separated regardless of width, per DESIGN_SYSTEM.md §11's non-negotiable floor).
- **Medium:** 2-per-row grid; same card anatomy, no field reordering.
- **Wide:** 3+-per-row grid (public/warm density) or compact table-row treatment (dashboard density, Direction C) — the `public`/`dashboard` variant split defined in COMPONENT_ARCHITECTURE.md §3 is what changes here, not the breakpoint tier itself; a dashboard-variant card stays dense even at Wide, and a public-variant card stays spacious even when it must drop to 1-per-row at Compact.
- **Never removed at any tier:** status, price, location, bedroom count — DESIGN_SYSTEM.md §11's card-anatomy floor applies at every breakpoint identically; only image size and card padding scale down, never the required fact set.

---

## Dashboard Transformation

- **Compact:** Single-column stacked sections (Summary/Attention Panel → content list) per WIREFRAME_PLAN.md; Dashboard Sidebar becomes a bottom/top tab bar as noted above; Management List/Table renders as a stacked card list rather than a table (see Table/List Transformation below).
- **Medium:** Two-region layout becomes viable (a slim persistent sidebar + content) if width allows; otherwise behaves as Compact.
- **Wide:** Full sidebar + content two-region layout, Management List/Table can render in true tabular form with visible columns.
- **Constant across all tiers:** the Summary/Attention Panel (pending/urgent items) always renders first in document order, regardless of how the surrounding layout reflows — this is a DESIGN_SYSTEM.md §4/§12 requirement, not something that should be deprioritized for the sake of a denser layout at any breakpoint.

---

## Table/List Transformation

Applies to Management List/Table (My Listings, My Advertisements, My Service Listing) and Message Thread List:

- **Compact:** Always a stacked list of cards/rows, one per line, full-width — never a horizontally-scrolling table. Each item still shows its full status label (never abbreviated to a color dot, per DESIGN_SYSTEM.md §14) even in this compact form.
- **Medium:** May remain a stacked list, or introduce 2-column card arrangement for shorter-content items (e.g., Ad list) — table form is not required at this tier.
- **Wide:** May render as a true table with visible column headers (status, key facts, action) for Direction C's dashboard density — this is the one context where DESIGN_SYSTEM.md explicitly sanctions table-like density, and only at Wide, where horizontal space supports it without requiring horizontal scroll.
- **Never:** a horizontally-scrolling table at Compact/Medium — this is explicitly excluded as it would hide status/action content off-screen, violating the "never hidden behind interaction" rule in DESIGN_SYSTEM.md §7.

---

## Modal/Drawer Behavior on Mobile

- **Auth Prompt Modal:** on Compact, becomes a full-width bottom-sheet-style modal rather than a centered dialog (per WIREFRAME_PLAN.md) — improves thumb reachability for the Login/Register choice; on Medium/Wide, remains a centered dialog anchored near its trigger (DESIGN_SYSTEM.md §13).
- **Filter Panel:** persistent sidebar at Wide; collapses to a drawer (triggered by an explicit "Filters" control, not an implicit gesture) at Compact/Medium — this is the one drawer pattern explicitly sanctioned in DESIGN_SYSTEM.md §13, scoped specifically to this responsive collapse, not introduced as a general-purpose pattern elsewhere.
- **Confirmation Dialogs:** remain centered/blocking modals at every breakpoint — never converted to a drawer, since they gate a destructive action and should interrupt with equal visual weight regardless of device.
- **Dropdowns (Role Switcher, Account menu):** on Compact, may expand to a full-width overlay rather than a small anchored popover, for touch-target reachability; on Medium/Wide, standard anchored dropdown behavior.

---

## CTA Placement Changes

- **Property Details — Message Landlord:** positioned inline after Property Summary at Medium/Wide; becomes a **sticky, bottom-anchored button** at Compact (per WIREFRAME_PLAN.md), since this is DESIGN_INTENT.md §5's single most important conversion action in the entire product and must remain reachable without scrolling back up on a long detail page.
- **Message Composer (reply):** sticky at the bottom of the thread view at Compact, inline at the bottom of the visible thread at Medium/Wide — consistent behavior, different anchoring mechanism.
- **Post a Property / Submit (forms):** end-of-form placement at all tiers (not stickied), since these are multi-field forms where a stickied submit risks users submitting before reviewing required fields above — a deliberate exception to "always make primary actions maximally reachable," justified by DESIGN_SYSTEM.md §9's transparency requirement (the user should see what they're submitting/paying for before the action is one tap away).
- **Subscribe/Pay:** end-of-form placement at all tiers, same reasoning — payment actions are never made stickied/instantly reachable, consistent with DESIGN_INTENT.md §8's rule against motion/placement being used to create urgency around payment.

---

## Touch and Accessibility Considerations

- All interactive elements (buttons, form controls, card tap targets) meet a minimum touch-target size at Compact/Medium — applies uniformly regardless of Direction C's density preference in dashboards; density reduces padding/visual size, never the actual tappable hit area.
- Hover-only interactions are not used to reveal required information at any tier — since Compact/Medium are touch-primary (no hover state exists reliably on touch devices), and DESIGN_SYSTEM.md §7 already requires trust/status information to never depend on an interaction to discover.
- Sticky CTAs (Message, Reply composer) must not obscure content permanently — they reserve layout space rather than floating over content, so status/trust information near the bottom of a screen is never covered.
- Filter Panel drawer and Role Switcher/Account dropdown remain fully keyboard-operable even in their mobile-collapsed forms, consistent with DESIGN_SYSTEM.md §15.
- `prefers-reduced-motion` is honored identically at every breakpoint (DESIGN_SYSTEM.md §16) — responsive layout changes are not an exception to that rule.
- Text reflows rather than truncates at smaller widths wherever feasible; where truncation is unavoidable (e.g., a long address in a compact card), status/price/action are never the truncated elements — only lower-priority descriptive text is allowed to truncate.
