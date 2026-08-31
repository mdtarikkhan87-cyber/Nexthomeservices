# NextHome — Role, Routing & Post-Login Experience Audit

**Status:** Audit complete; Section 4's Option C has since been approved and implemented — see [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) "Decision: Renter/Buyer Context Model" for the recorded decision, and Section 6 below for updated gap statuses. The analysis in Sections 1–5 is left as originally written (it's what the decision was based on); only the gap table in Section 6 has been updated to reflect what's now resolved.

**Update, 31 August 2026 — roles vs. activeRole.** A second pass separated the account's permanent role list from the role it is currently acting as, and made the role prompt conditional. This resolved gaps 6, 7 and 8 below and is recorded in PRODUCT_DECISIONS.md "Decision: Role Selection & Active-Role Model". **Section 7, added at the end of this document, is the part worth reading** — it lists every place `activeRole` had been standing in for a permission check, which is where the reported symptom (a role prompt for single-role accounts) actually came from. Sections 1–5 remain as originally written.
**Sources inspected:** `NextHome_PRD_Phase1_Final.pdf`, [PRODUCT_UNDERSTANDING.md](PRODUCT_UNDERSTANDING.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [USER_JOURNEYS.md](USER_JOURNEYS.md), [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md), [SCREEN_BLUEPRINTS.md](SCREEN_BLUEPRINTS.md), [WIREFRAME_PLAN.md](WIREFRAME_PLAN.md), [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md), [RESPONSIVE_STRATEGY.md](RESPONSIVE_STRATEGY.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), and the live implementation in `frontend/src/lib/auth-context.tsx`, `frontend/src/lib/types.ts`, `frontend/src/components/dashboard/DashboardNav.tsx`, `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/register/page.tsx`, `frontend/src/app/account/page.tsx`, `frontend/src/components/shared/AuthGate.tsx`.

## 0. Figma Accessibility

**The Figma file could not be accessed.** I tried two ways:
1. `WebFetch` on the provided URL — returned no usable content (the tool received only the literal word "Figma," with no design data, screens, or screenshots present in the response).
2. Direct browser navigation to the URL — it **redirected to `figma.com`'s generic public marketing homepage**, with no design content rendered. This is consistent with the link requiring an authenticated Figma session that isn't available in this environment ("Figma Make" project links are private/interactive prototypes, not public static shares).

**Per your instruction, I have not guessed at the Figma's screens, layouts, or navigation.** Section 2 below states this limitation again and does not speculate. Everything else in this audit is based entirely on the approved local documents and the current implementation. If you can export/screenshot the relevant Figma screens, or grant access another way, I can re-run the comparison in Section 2 specifically.

**Addendum (2026-08-21):** A separate, different design artifact — a Claude Design project (`NextHome.dc.html`, accessed via the `claude_design` MCP, not the `figma.com` link above) — was subsequently reviewed and happened to cover this exact question. It confirmed the same shape as Option C: one account, a header-level "Renter | Buyer" toggle picked at signup ("I'm here mainly to… / You can switch roles any time from the header"), not two separate roles. It also included several features with no basis in the approved PRD (Shortlet/Joint Venture categories, map search, escrow/mortgage tracking, lease renewal, an offers/negotiation table) — none of which were carried into the implementation; only the structural idea of a genuinely distinct, content-rich Renting/Buying dashboard was, translated into NextHome's real brand and real data. See `frontend/src/app/dashboard/page.tsx` for the result. The original `figma.com` link from Section 0 above was never accessed and remains an open item if you still want it compared specifically.

---

## 1. Current Implementation

### Current roles
Exactly four end-user roles exist in the codebase (`frontend/src/lib/types.ts`):
```ts
export type RoleName = "landlord" | "tenant-buyer" | "service-provider" | "advertiser";
```
There is **no "renter" role and no "buyer" role** anywhere in the codebase. A project-wide search for "Renter" returns zero matches in any file, document, or code — the term has never existed in this project before your message today. "Tenant/Buyer" is a single, merged role everywhere: `Header.tsx`, `PropertyCard.tsx`, `AuthGate.tsx`, `ListingActions.tsx`, `register/page.tsx`, `account/page.tsx`, `dashboard/page.tsx`, `DashboardNav.tsx`, and `auth-context.tsx` all reference it as one unit.

### Current routes
Single shared dashboard route tree for every role: `/dashboard`, `/dashboard/listings`, `/dashboard/listings/new`, `/dashboard/listings/[id]`, `/dashboard/subscription`, `/dashboard/saved`, `/dashboard/messages`, `/dashboard/service-listing`, `/dashboard/ads`, `/dashboard/ads/new`. There are no role-specific top-level route trees (e.g. no `/renter/*` or `/buyer/*`) — a `NAV_BY_ROLE` lookup table in `DashboardNav.tsx` decides which of these routes appear in the sidebar per active role.

### Current post-login behavior
Every authenticated user lands on the **same route**, `/dashboard`. That single page component (`app/dashboard/page.tsx`) then branches its *content* — not its route — based on `activeRole`: a Landlord sees "My Listings" + subscription prompts, a Tenant/Buyer sees a "keep browsing" prompt, a Service Provider sees a listing-management prompt, an Advertiser sees a "submit a new ad" prompt. So it is **not literally one generic identical dashboard** — content is role-aware — but it **is** one shared route/component with `if (activeRole === "x")` branches, which is architecturally different from either (a) fully separate role-specific landing routes, or (b) genuinely distinct Renter vs. Buyer experiences, since no such split exists to branch on in the first place.

### Is Tenant/Buyer currently merged?
Yes — and this was a **deliberate, explicit, already-approved decision**, not an oversight or a bug. `PRODUCT_DECISIONS.md` §1 states:

> "A single user account may hold **more than one** of the four end-user roles (Landlord, Tenant/Buyer, Service Provider, Advertiser) simultaneously."

`PRODUCT_UNDERSTANDING.md` (derived directly from the original PRD's user table) defines Tenant/Buyer as one row: *"Find a real, accurate place to rent or buy"* — the PRD itself never separates renting-intent from buying-intent into different people or different roles; it treats "search rent or sale listings" as one unified capability of one user type.

### What each authenticated user currently sees
- **Landlord:** Overview → My Listings, Post a Property, Subscription, Messages
- **Tenant/Buyer:** Overview → Saved Homes, Messages (identical regardless of whether they've only ever searched Rent, only Sale, or both)
- **Service Provider:** Overview → My Service Listing, Messages
- **Advertiser:** Overview → My Advertisements, Submit Advertisement

---

## 2. Figma Findings

**Not completed — the file is inaccessible (see Section 0).** No claims are made here about a Renter experience, Buyer experience, or any screen from the Figma, because none of it could be observed. If/when access is available, this section should be filled in and cross-referenced against Section 4's recommendation before any implementation decision is finalized.

---

## 3. Product Model Comparison

| Question | Approved documentation | Current implementation | Figma | Your stated intent (this message) |
|---|---|---|---|---|
| Is Renter a role distinct from Buyer? | **No** — PRD/PRODUCT_DECISIONS.md define one merged "Tenant/Buyer" role | Matches docs — one merged role, no split | Unknown (inaccessible) | **Yes** — you describe a distinct "RENTER EXPERIENCE" and "BUYER EXPERIENCE" |
| Does public browsing require login? | No — explicit rule, PRODUCT_DECISIONS.md §2 | Matches — homepage/search/services/listing-detail are all public | Unknown | Matches — you require this too |
| Are protected actions gated correctly? | Yes — PRODUCT_DECISIONS.md §9, USER_JOURNEYS.md §3 | Matches — `AuthGate.tsx` implements exactly this flow, including in-place inline login and return-to-context for Register | Unknown | Matches |
| Does one account support multiple roles? | Yes — PRODUCT_DECISIONS.md §4, §8.1 | Matches — `addRole`/multi-role state confirmed working (audited and browser-tested in a prior session) | Unknown | Matches — Flow D in your message describes the same model |
| Does adding a role restrict existing roles? | No — PRODUCT_DECISIONS.md §8.1 | Matches — confirmed by direct test | Unknown | Matches |
| Is account-level verification separate from role-level? | Yes — PRODUCT_DECISIONS.md §6 | Matches — modeled explicitly in `auth-context.tsx`/`types.ts` | Unknown | Matches |
| Does everyone land on one truly generic dashboard? | Docs describe one shared *shell* with role-specific *content* (COMPONENT_ARCHITECTURE.md §4: "shared structure, role-specific content injected") | Matches that description exactly | Unknown | You describe this as the problem — but as documented, it's already role-branching content, not identical content |

### Where the real disagreement is

The **only** substantive conflict is: **your stated intent introduces "Renter" and "Buyer" as two separate things**, and no approved document — PRD, PRODUCT_UNDERSTANDING.md, or PRODUCT_DECISIONS.md — currently supports that split. This isn't a case of the implementation drifting from an approved decision; it's a case of your new request potentially **superseding** an already-approved decision (PRODUCT_DECISIONS.md §1's four-role list, which was explicitly reasoned through and approved in an earlier session).

That means: before any code changes, this needs a new, explicit product decision — either amending PRODUCT_DECISIONS.md §1, or clarifying that "Renter experience" and "Buyer experience" are *contexts within* the existing Tenant/Buyer role rather than new roles (see Section 4).

---

## 4. Recommended Role/Context Architecture

**I am not implementing anything below. This is the analysis you asked for, to inform a decision.**

Three real options exist. I'll lay out what each preserves and what each requires.

### Option A — Keep one merged "Tenant/Buyer" role, add an internal Rent/Buy *context* (no new role)

A Tenant/Buyer's dashboard becomes aware of *what they were last doing* (browsing Rent vs. browsing Sale/Buy) and lightly tailors itself — e.g., "Saved Homes" could show a Rent/Buy tab, or the dashboard's primary prompt could reflect their most recent search mode. No new `RoleName` value, no new registration branch.

- **Preserves:** PRODUCT_DECISIONS.md §1 exactly as approved — zero conflict, no decision amendment needed.
- **Requires:** A small, additive change to what data the Tenant/Buyer role tracks (e.g., "last active search mode"), not a new role.
- **Risk:** If your real intent is a *structurally* distinct experience (different nav, different landing content, different account framing) rather than a lightly-tailored view, this option under-delivers.

### Option B — Split into two real roles: `renter` and `buyer` (replacing `tenant-buyer`)

`RoleName` gains `"renter" | "buyer"` in place of `"tenant-buyer"`. Registration asks the user to pick Renter or Buyer specifically. Each gets its own dashboard nav entry set, its own landing content, potentially its own Saved-Homes framing.

- **Preserves:** Public browsing rules, gated-action flow, multi-role support (a user could hold both `renter` and `buyer` simultaneously, same as any two roles today), account/role verification separation — none of these architectural mechanisms need to change, only the *set of role values* changes.
- **Requires:** A formal amendment to PRODUCT_DECISIONS.md §1 (the role list is explicitly "final" and was a deliberate decision — this is not a drop-in change). Also requires deciding: does someone searching both Rent and Sale listings now need *two* roles on one account? That has real UX cost (two separate onboarding/verification tracks for what the PRD currently treats as one natural user behavior — "search rent or sale listings" in a single sentence, PRD §3).
- **Risk:** This is the option most likely to match a literal reading of your message ("RENTER EXPERIENCE" / "BUYER EXPERIENCE" as headed, parallel sections alongside Landlord/Service Provider/Advertiser) — but it's also the one most likely to conflict with the PRD's own framing of this user type, and the most disruptive to existing approved docs (USER_JOURNEYS.md, INFORMATION_ARCHITECTURE.md, SCREEN_BLUEPRINTS.md all currently describe one "Tenant/Buyer" journey, not two).

### Option C — One role, two selectable *contexts*, same mechanism as role-switching

Keep `tenant-buyer` as the single `RoleName` (no PRODUCT_DECISIONS.md §1 amendment needed), but let the account carry a **context** flag (`"renting" | "buying"`) alongside it — switched the same way roles are switched today (from the account area), changing dashboard nav/content, but *not* requiring separate registration, separate verification, or a second entry in the four-role list.

- **Preserves:** PRODUCT_DECISIONS.md §1's role list untouched. Preserves the existing account-level vs. role-level verification split completely (a context switch isn't a verification event at all). Multi-role support is unaffected since context is orthogonal to role.
- **Requires:** A smaller, additive decision — not amending the role list, but defining a new "context" concept alongside it, which itself needs sign-off since it's a new mechanism not currently described anywhere in PRODUCT_DECISIONS.md.
- **Risk:** Introduces a second axis of state (role × context) that every future screen/component needs to be aware of — real complexity cost, but bounded, and it's the option that changes the *least* already-approved material.

### My read

**Option C is the closest fit to what you actually described**, once the wording is unpacked carefully. You explicitly modeled this after the *existing, approved* multi-role mechanism in Flow D ("switching roles must change the private navigation/dashboard context... adding a new role must not restrict already active roles... preserve the approved account-level vs role-level verification model") — that's describing the role-switching mechanism, applied to Renter/Buyer. Option C gets you that exact behavior without contradicting PRODUCT_DECISIONS.md §1's already-approved role list, and without forcing a Tenant/Buyer who does both rent and buy searches into two separate accounts-within-an-account. Option B is the more literal reading if you specifically want Renter and Buyer to be full peers of Landlord/Service Provider/Advertiser (e.g., for future independent monetization or independent verification requirements) — that's a legitimate reason to choose B over C, but it's a call only you can make, and it should be made explicitly, not inferred.

**I have not chosen for you. This needs your decision before any implementation.**

---

## 5. Route and Redirect Map (proposed, pending your decision on Section 4)

This assumes **Option C** (context-within-role) since it's my recommendation, with Option B's alternative noted inline where it would differ.

| User | Landing route after login | Nav/dashboard scope |
|---|---|---|
| **Logged-out visitor** | N/A — stays on current public page; gated action triggers `AuthGate` modal in place | Full public site: homepage, `/search` (Rent/Buy modes), `/services`, `/listing/[id]`, `/services/[id]`, `/help`, `/advertise`, `/feedback`, `/complaints` — unrestricted |
| **Renter context** (Tenant/Buyer role, context = renting) | `/dashboard` | Saved Homes (rent items), Messages — same routes as today; nav copy/framing adapts to "renting" |
| **Buyer context** (Tenant/Buyer role, context = buying) | `/dashboard` | Saved Homes (sale items), Messages — same routes; nav copy/framing adapts to "buying" |
| *(Option B alternative)* **Renter role** | `/dashboard` | Same routes, but `renter` is its own `RoleName`, own registration branch |
| *(Option B alternative)* **Buyer role** | `/dashboard` | Same routes, but `buyer` is its own `RoleName`, own registration branch |
| **Landlord** | `/dashboard` | Unchanged: My Listings, Post a Property, Subscription, Messages |
| **Service Provider** | `/dashboard` | Unchanged: My Service Listing, Messages |
| **Advertiser** | `/dashboard` | Unchanged: My Advertisements, Submit Advertisement |
| **Multi-role user** | `/dashboard`, scoped to whichever role/context is currently active | Role switcher (Account area) controls active role; under Option C, a context switcher sits alongside it for Tenant/Buyer specifically |

No new top-level route trees are proposed under either option — role/context differentiation stays inside the existing shared `/dashboard` shell with role-aware content, consistent with COMPONENT_ARCHITECTURE.md §4's explicit "one shared frame, role-specific content" design, which nothing in your message asked to change.

---

## 6. Implementation Gaps

| # | Gap | Classification | Status |
|---|---|---|---|
| 1 | No architectural decision exists for Renter vs. Buyer (role split vs. context split vs. status quo) | ~~BLOCKER~~ **RESOLVED** | Option C approved and implemented — see [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) "Decision: Renter/Buyer Context Model." `tenant-buyer` gained a `context: "rent" \| "sale"` field, switchable from `/account` and the dashboard home, filtering Saved Homes and dashboard copy accordingly. Verified end-to-end in-browser (header label, dashboard title/copy, Saved Homes filtering all update together; switching context does not touch verification/subscription state or other roles). |
| 2 | Figma comparison incomplete | **BLOCKER** (unchanged) | Still not accessible. Option C was chosen without it, based on best fit to approved docs — if the Figma later turns out to require true role-level separation, revisit per the "What remains open" note in the new PRODUCT_DECISIONS.md entry |
| 3 | If Option B is chosen: PRODUCT_DECISIONS.md §1 role list needs formal amendment | **MOOT** | Option C was chosen instead — §1 was left untouched, exactly as this gap recommended if B were avoided |
| 4 | If Option B is chosen: USER_JOURNEYS.md, INFORMATION_ARCHITECTURE.md, SCREEN_BLUEPRINTS.md need re-authoring for two journeys | **MOOT** | Same reason — Option C requires no changes to these documents |
| 5 | "Shortlets" and "other publicly browsable property categories" aren't approved product concepts | **HIGH** (unchanged, not addressed by this decision) | Still open — was out of scope for the Renter/Buyer decision specifically and was not introduced |
| 6 | Post-login redirect logic is role-branching content on one shared route, not per-role landing routes | ~~RESOLVED as N/A~~ **REOPENED then RESOLVED (31 Aug 2026)** | The client subsequently specified per-role landing pages, so this stopped being N/A. `ROLE_LANDING_HREF` in `lib/roles.ts` now maps each role to a destination; `/dashboard/landlord` and `/dashboard/services` were added as real routes, `/listings` and `/dashboard/ads` already existed. `/dashboard` is a resolver that hands over to the active role's home. Landing is explicitly **not** an access boundary — see gap 7 |
| 7 | No route-level guard exists yet anywhere (dashboard access is a client-side render check) | ~~MEDIUM~~ **RESOLVED (31 Aug 2026)** | `RoleScoped` (`components/shared/RoleScoped.tsx`), applied once in the dashboard layout against a route→role table in `lib/roles.ts`. It checks `user.roles.includes(requiredRole)` — the permanent list, never `activeRole`. Holding the role while acting as another switches and continues; not holding it blocks and names the missing role. Still a client-side check (there is no backend), but it is now an actual check rather than an absence of links |
| 8 | `roleLabels`/`roleTitles` duplicated across three files | ~~LOW~~ **RESOLVED (31 Aug 2026)** | `lib/roles.ts` is the only copy. The account page's private map was deleted; the dashboard's `roleTitles` moved into the single `RoleOverview` component that now renders every role's overview |

---

## 7. Where `activeRole` was standing in for a permission check (31 Aug 2026)

The reported symptom was a role prompt shown to single-role accounts. The cause underneath it was that `activeRole` had accumulated a second job it was never suited for. Below is every place that had happened, separated into the ones that were genuinely wrong and the ones that are correct view-context use and were deliberately left alone.

### 7a. Genuine misuse — fixed

| # | Where | What it was doing | Why it was wrong | Now |
|---|---|---|---|---|
| 1 | `app/dashboard/layout.tsx` + `components/dashboard/DashboardNav.tsx` | `NAV_BY_ROLE[activeRole]` decided which dashboard links existed. **No route-level check existed anywhere.** | This is the big one, and it is a permission check by *omission*. A Renter who typed `/dashboard/listings` got the landlord's listings; a Landlord who typed `/dashboard/saved` got Saved Homes. The sidebar was the entire security model, and a URL bar defeats it. | `RoleScoped` in the layout, checking `user.roles`. The nav is back to deciding only what is *offered* |
| 2 | `components/shared/Header.tsx` — `canListProperty` | `isAuthenticated && activeRole === "landlord"` gated the **only** link to `/dashboard/listings/new` | Using activeRole to decide whether to *show* a landlord action is correct and is kept. The problem was that this visibility check was also the only thing protecting the route behind it | Unchanged as a visibility rule. The route itself is now guarded independently |
| 3 | `components/home/ClosingCta.tsx` | Same `activeRole === "landlord"` shape on the homepage CTA | Same as #2 | Unchanged, same reason |
| 4 | `lib/auth-context.tsx` — `addRoles` | Set `activeRole` to `primaryRole(fresh)`, i.e. by a fixed priority order (Renter first) rather than to the role just added | A Renter who added Landlord stayed acting as a Renter. They had just asked for the Landlord role and were left looking at the view they already had — the new dashboard existed but nothing took them to it | The newly added role becomes active immediately, and `/account` lands the user on its dashboard |
| 5 | `app/dashboard/page.tsx` | Every role's overview lived in one component branching on `activeRole` read from context | Not a permission bug, but it made per-role landing routes impossible: `/dashboard/landlord` cannot render the landlord overview if the component asks the global active role what to draw | Extracted to `components/dashboard/RoleOverview.tsx`, which takes the role as a **prop**. One component, four bodies, no duplicated markup |
| 6 | `lib/auth-context.tsx` — `login()` | Hard-coded a grant of Renter **and** Landlord for every demo sign-in | The proximate cause of the reported symptom. Not a permission misuse, but it meant every sign-in was multi-role, so the prompt was always owed and rule 1 was unreachable in review | Three demo accounts of different shapes (`lib/demo-accounts.ts`), chosen from the picker on `/login` |

### 7b. Correct view-context use — deliberately not changed

| Where | Why it is fine |
|---|---|
| `app/account/page.tsx` — active-role card highlight, "Switch to" button | States and changes the view context. Exactly what activeRole is for |
| `components/shared/RoleSwitcher.tsx`, `RoleSessionPrompt.tsx` | Both now decide *whether to render at all* from `user.roles`, and use `activeRole` only to mark which option is currently selected — the correct split |
| `components/dashboard/RoleOverview.tsx` | Branches on a role prop, not on global state |

### 7c. One left open — notifications are scoped by `activeRole`

`lib/notification-context.tsx` filters the feed to `activeRole` (lines 41–43), and `markAllRead` marks only the active role's items (line 55).

This is view context, and scoping a role's inbox to that role is the intended behaviour (INFORMATION_ARCHITECTURE.md: the notifications entry point "surfaces the active role's inbox"). But it is the one remaining place where a *view* context decides what **data** a user can see at all: a Landlord + Renter acting as Renter cannot see their landlord notifications, and the header bell's unread count under-reports everything happening in their other role. A landlord could miss an enquiry entirely because they were browsing.

**Not changed, and not silently resolved.** Whether the bell should aggregate across held roles (with per-role grouping) or stay scoped to the active role is a product question, not a refactor — and answering it by guessing is exactly what this document exists to prevent. Raising it here as the natural next question this work exposes.

---

## Summary — Current Status

1. ✅ Architecture decided: **Option C**, recorded in [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md).
2. ✅ Implemented and verified in-browser: `frontend/src/lib/types.ts`, `frontend/src/lib/auth-context.tsx`, `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/dashboard/saved/page.tsx`, `frontend/src/app/account/page.tsx`, `frontend/src/components/shared/Header.tsx`. Build and lint both clean.
3. ⏳ Figma still not accessible — this decision was made without it. If your reference design actually requires full role separation (Option B), say so explicitly and this should be revisited as its own decision, not silently reworked.
4. ⏳ "Shortlet" and other property categories beyond Rent/Sale remain unaddressed — separate decision needed if you want them.
5. ✅ **Roles vs. activeRole separated (31 Aug 2026)**, recorded in PRODUCT_DECISIONS.md "Decision: Role Selection & Active-Role Model" and [REVISION_LOG.md](REVISION_LOG.md) §12. Gaps 6, 7 and 8 closed. Verified in-browser across all three demo account shapes: single-role sign-in prompts nobody and renders no switcher, a saved preference restores without prompting, a deep link into a role-scoped route switches and continues, and an account that does not hold a role is blocked by name. Build and lint clean.
6. ⏳ **Notifications are still scoped to `activeRole`** (§7c) — the one place a view context still decides what data is visible. Needs a product answer, not a refactor.
