# NextHome — Product Decisions

This document records official product decisions made outside the original PRD (`NextHome_PRD_Phase1_Final.pdf`). Each entry is a binding addition/clarification to Phase 1 scope once approved. See [PRODUCT_UNDERSTANDING.md](PRODUCT_UNDERSTANDING.md) for the baseline product analysis.

---

## Decision: Authentication & Role-Based Access Model

**Status:** APPROVED
**Date:** 2026-08-19
**Supersedes/extends:** PRD §3, §5, §6.1–§6.8 (adds detail not specified in the original PRD)

### Decision

NextHome will use a public-browse / gated-action authentication model:

- Property, sale, and service listings — and public advertiser-facing content — are browsable without an account.
- Authentication is required only when a user attempts a protected action.
- After login, users land on a role-based dashboard scoped to their active role.
- A single account may hold multiple roles, with one role active at a time via role switching.

---

### 1. Final List of Supported Roles

- **Landlord**
- **Tenant / Buyer**
- **Service Provider**
- **Advertiser** *(newly added to the access model by this decision)*
- **Admin** — out of scope for this decision; uses a separate, non-public authentication path per the security consideration in the original analysis (admin auth is not exposed through the standard user-facing Login/Register entry point).

A single user account may hold **more than one** of the four end-user roles (Landlord, Tenant/Buyer, Service Provider, Advertiser) simultaneously. See §8 (Role Switching).

---

### 2. Public Browsing Rules

No authentication is required to:

- Browse Rent and Sale listings, including search and filters (state, price, bedrooms, Short-Term/Long-Term).
- View a listing's full detail page, photos, and view count.
- Browse the Service Provider directory.
- View publicly placed advertisements.
- View the Help/FAQ section.

---

### 3. Protected Action Rules

Authentication is required to:

- List a property (Landlord)
- Submit a property for admin review — *(this replaces the earlier ambiguous "Verify Property" label; the landlord submits a listing, only Admin approves it, per PRD §6.2 — landlords hold no approval authority)*
- Save or unsave a property listing (Tenant/Buyer) — **new feature, approved below (§Feature Decision 1)**
- Message a landlord, tenant, or service provider (all roles)
- Register/list as a Service Provider, or manage an existing service listing
- Create, submit, manage, pay for, or view account-specific advertising activity (Advertiser)
- Access any dashboard or account-specific data, for any role

---

### 4. Approved Feature/Scope Decisions

#### 4.1 Saved Homes — APPROVED (new feature)

- Tenant/Buyer users can save and unsave publicly visible property listings.
- Saved properties must be accessible from the Tenant/Buyer dashboard ("Saved Homes").
- This is an approved net-new feature outside the original PRD's Phase 1 feature list (PRD §11.1) and should be tracked as such for effort/scope purposes.

#### 4.2 Property Applications — REJECTED as a structured feature; replaced with Messages

- No structured "Property Applications" workflow (application object, status states, accept/reject) will be introduced at this stage.
- The approved tenant interaction model remains messaging-based, consistent with PRD §6.3–§6.4.
- The Tenant/Buyer dashboard item is **"Messages"**, not "Property Applications."
- A structured application workflow may be introduced later only through a separate, explicitly approved product decision.

---

### 5. Registration and Verification Flows Per Role

**Landlord:**
- Full Basic Trust Layer required at registration: phone OTP verification, email verification, mother's maiden name, admin-reviewed document upload (per PRD §6.1).
- Account is authenticated immediately after phone OTP + email, but remains in a "pending review" state until admin approves the uploaded document.
- Listing publication additionally requires an active subscription (PRD §6.5) — a separate gate from verification (see §6, Account State Model).

**Tenant / Buyer:**
- **Lighter registration flow, approved.**
- Required at initial registration: phone OTP verification and email verification only.
- Tenant/Buyer users are **not** required to complete the full Basic Trust Layer or upload documents at initial registration.
- Additional verification may be introduced later only if required by a future feature or separate product decision.

**Service Provider:**
- Full Basic Trust Layer required at registration: phone OTP verification, email verification, mother's maiden name, admin-reviewed document upload (per PRD §6.1, §6.7).
- Same pending-review state behavior as Landlord.

**Advertiser:**
- **Lightweight verification flow, approved.**
- Required at initial registration: email verification and phone OTP verification only.
- Advertisers are **not** required to complete the full Basic Trust Layer used by Landlords and Service Providers — no document upload, no mother's maiden name field, and no full admin identity verification, unless a future product decision explicitly adds this requirement.
- Advertisement *content* (image, text, link) remains subject to the PRD-defined admin review process (PRD §9) — this is separate from, and unaffected by, the advertiser's own account verification level.
- Advertiser flow: Register → verify email and phone → active advertiser account → create/submit advertisement → advertisement content review → approved or rejected → payment/placement flow where applicable.
- **Advertiser account verification and advertisement content approval are two distinct states and must never be conflated in the UI or in permission logic** — an advertiser can be fully "active" at the account level while a specific ad remains "pending review" at the content level.

---

### 6. Account State Model

The following state model applies per role and must drive both dashboard behavior and gated-action availability. It distinguishes **account-level verification state** (tied to the person/identity behind the account) from **role-level verification and approval state** (tied to a specific role's additional requirements, and to individual content items like listings/ads within that role) — these must be evaluated independently.

**Account-level state (shared across all roles on the account):**

```
unauthenticated
   → authenticated (email + phone OTP verified)
```

Email and phone OTP verification are **account-level**, not role-level. Once completed, they satisfy the base verification requirement for **every** role subsequently added to the account — they are never re-collected or re-verified when a user adds a new role. See §8 (Role Switching) for the full reuse rule.

**Role-level state (tracked independently per role on the account):**

```
role added (inherits verified email + phone from account level)
   → [Landlord / Service Provider only] pending admin document review
        (role-specific requirements only: mother's maiden name, document upload)
   → role verified
   → [Landlord only] subscribed/active (required specifically to publish a listing, PRD §6.5)
```

- **Tenant/Buyer:** reaches "role verified" as soon as account-level email + phone verification completes — no additional role-specific requirement exists.
- **Advertiser:** reaches "role verified" (referred to as "active advertiser account" in the approved flow above) as soon as account-level email + phone verification completes — no additional role-specific requirement exists under this decision.
- **Landlord / Service Provider:** account-level verification (email + phone) is satisfied immediately, but the role itself remains in "pending admin document review" until admin approves the role-specific document upload. The role is "verified" only after that approval.
- **Content-item-level state** (a specific listing, service listing, or advertisement) is a further, separate layer beneath role-level state — e.g., a fully "verified" Landlord role can still have an individual listing sitting in "pending" content review (PRD §6.2), and a fully "active" Advertiser account can still have an individual ad in "pending" content review (PRD §9, and per the Advertiser flow above).
- A verified-but-unsubscribed Landlord can log in, access their dashboard, and manage account details, but cannot publish a listing until subscription payment completes.
- Dashboards and gated-action checks must read the appropriate layer of this state explicitly (account vs. role vs. content-item), never collapse them into a single boolean "logged in" flag, since each layer has different UI/permission implications.

---

### 7. Role-Specific Dashboard Scope

**Landlord:**
- My Listings (pending / live / rejected)
- Post a Property (blocked until subscription active)
- Subscription/Billing status and management
- Tenant Messages (per-listing threads)
- Listing performance (view counts)
- Account/profile + Trust Layer verification status

**Tenant / Buyer:**
- Saved Homes *(new feature, §4.1)*
- Messages *(replaces "Property Applications," §4.2)*
- Account/profile settings

**Service Provider:**
- My Service Listing (status: pending/live)
- Customer Messages
- Account/profile + Trust Layer verification status

**Advertiser:**
- My Advertisements (submitted / pending review / live / rejected)
- Ad payment/billing status
- Account/profile settings

*(Admin dashboard scope is defined separately in PRD §6.8 and is unaffected by this decision.)*

---

### 8. Role Switching Behavior

- A single account may hold multiple roles (e.g., a user who is both a Tenant/Buyer and a Landlord).
- Users can add or activate an additional role from their existing account without creating a separate account.
- Only **one role context is active at a time** for the purposes of dashboard content and role-specific navigation.
- Role switching is accessible from the account/profile area.
- Switching roles changes the active dashboard and navigation context; it does not log the user out or require re-authentication.

#### 8.1 Adding a New Role — Trust Layer Reuse (APPROVED)

When a user adds a new role to an existing account, **already-verified account-level information must be reused, never re-collected:**

- Verified email and verified phone number are account-level facts, established once, and carry forward to every role subsequently added to the account.
- The user must **not** repeat email or phone OTP verification when adding another role.

For a new role that carries **additional** role-specific Trust Layer requirements (i.e., adding a Landlord or Service Provider role, which require mother's maiden name + document upload beyond the account-level email/phone):

1. Reuse the existing verified account-level information (email, phone) — do not re-request it.
2. Request only the information/documents missing for the new role (mother's maiden name, document upload).
3. Submit only the new role-specific requirements for admin review.
4. Set **only the new role** to a pending state requiring admin approval.
5. Do **not** restrict the user's already-approved or already-active roles while the new role is pending review.

**Example:** A verified Tenant/Buyer who adds a Landlord role keeps full, uninterrupted access to their existing Tenant/Buyer experience (browsing, saving, messaging) while the Landlord role independently completes document upload and admin review. The two roles' states are tracked and evaluated independently, per the account-level vs. role-level distinction in §6.

---

### 9. Unauthenticated-Action Interception Behavior

- When an unauthenticated user attempts a protected action, intercept in place with an inline modal prompt ("Log in or create an account to..."), not a full-page redirect — preserving browsing context.
- The modal offers both Login and Register, defaulting to the Register path matching the action's implied role (e.g., attempting to list a property defaults to Landlord registration).
- The full intended destination **and** the specific intended action are preserved (e.g., "message landlord about Listing #123," not just the listing URL).

---

### 10. Post-Login Redirect Behavior

- Return the user to the originating context and re-trigger the intended action automatically where safe to do so (e.g., reopen a message composer).
- For actions with financial or other side effects, return to context but require explicit re-confirmation rather than auto-triggering the action.
- If registration required multi-step verification (Landlord/Service Provider Basic Trust Layer) and verification is incomplete, the gated action remains blocked, and the UI must clearly communicate the pending-review state rather than failing silently.

---

### 11. Remaining Assumptions and Deferred Decisions

These are explicitly **not** resolved by this decision and are deferred pending future product input — no assumption has been made about their outcome:

1. **Structured Property Applications workflow** — explicitly deferred; may be proposed later as a separate, independently approved product decision (§4.2).
2. **Additional Tenant/Buyer verification for future features** — this decision only sets the *initial* registration requirement; any feature later requiring stronger tenant verification needs its own decision (§5).
3. **Additional Advertiser verification for future features** — this decision only sets the *initial* registration requirement (email + phone OTP); document upload or full identity verification for Advertisers is out of scope unless a future decision explicitly adds it (§5).

*(Previously listed here: Advertiser verification requirements, and cross-role Basic Trust Layer reuse — both resolved by the approved decisions in §5 and §8.1 above.)*

---

## Consistency Check Against Original PRD — Remaining BLOCKER-Level Items

Both previously identified blocker-level items (Advertiser verification depth, and multi-role Basic Trust Layer reuse) have been resolved by the approved decisions in §5 and §8.1 above. No blocker-level conflicts remain against the original PRD as of this update.

---

## Decision: Renter/Buyer Context Model

**Status:** APPROVED
**Date:** 2026-08-21
**Supersedes/extends:** Clarifies §1 (Final List of Supported Roles) — does **not** amend the role list itself
**Source:** [ROLE_EXPERIENCE_AUDIT.md](ROLE_EXPERIENCE_AUDIT.md), Section 4, Option C

### Background

A request surfaced for distinct "Renter" and "Buyer" experiences, modeled after a Figma design that could not be accessed for verification (private/authenticated link — see ROLE_EXPERIENCE_AUDIT.md §0). Taken literally, this could have meant splitting the approved `Tenant/Buyer` role in §1 into two separate roles (`renter`, `buyer`) — a direct amendment to an explicit, already-approved decision. Three options were laid out in ROLE_EXPERIENCE_AUDIT.md §4; this entry records which was chosen and why.

### Decision

**§1's role list is unchanged: Landlord, Tenant/Buyer, Service Provider, Advertiser remain the four end-user roles.** "Renter" and "Buyer" are **not** new roles.

Instead, the Tenant/Buyer role gains a switchable **context**: `"rent" | "sale"` (reusing the existing rent/sale vocabulary already used for listing type and search mode — no new terminology introduced). This context:

- Defaults to `"rent"` when the Tenant/Buyer role is granted (at login or via Add a Role).
- Is switched from the same places role-switching already happens — the account/profile area (`/account`) and, for convenience, directly on the dashboard home — using the identical pill-toggle interaction pattern, not a new mechanism.
- Changes dashboard framing/copy ("Renting" vs. "Buying"), the default search-mode link, and filters the Saved Homes view to that context's listing type.
- Is **not** a verification event — switching context never touches `state`, `subscriptionState`, or any part of the account-level vs. role-level verification model (PRODUCT_DECISIONS.md §6). It is data on the existing `tenant-buyer` `HeldRole` entry, nothing more.

### Why this option, not a role split

- Preserves §1 exactly as approved — no amendment needed, no re-authoring of USER_JOURNEYS.md/INFORMATION_ARCHITECTURE.md/SCREEN_BLUEPRINTS.md's existing single Tenant/Buyer journey.
- Matches the PRD's own framing of this user type as one person who may "search rent or sale listings" (PRD §3) — not two separate people/accounts.
- Still delivers the actual behavior requested: distinct framing, distinct saved-items view, and a switch mechanism that behaves exactly like the already-approved multi-role switching pattern (PRODUCT_DECISIONS.md §8, §8.1) — including that switching context never restricts or resets anything else on the account.

### What remains open

The Figma design was never verified against this decision (inaccessible — see ROLE_EXPERIENCE_AUDIT.md §0). If the Figma turns out to require full role-level separation (e.g., independent verification requirements per Renter/Buyer, or independent monetization), this decision should be revisited explicitly — it was not silently assumed to be impossible, only deprioritized against the option that best fit currently-approved documentation.

"Shortlets" and property categories beyond Rent/Sale remain **not approved** and were not introduced by this decision (consistent with PRD §14 and the prior SearchBar decision excluding them for the same reason).

---

## Decision: Role Selection & Active-Role Model

**Status:** APPROVED
**Date:** 2026-08-31
**Supersedes/extends:** Amends §8 (Role Switching Behavior). Supersedes the once-per-session prompt model recorded in [REVISION_LOG.md](REVISION_LOG.md) §4. Amends [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) "Role Switching Access" (already amended once, in REVISION_LOG.md §3).
**Source:** Client instruction, 31 August 2026

### Background

The "how do you want to act today?" screen appeared for every sign-in, including accounts holding a single role — a dialog presenting a choice with one option in it.

The prompt was not the cause. The cause was that **two different concepts had never been separated**, so one value was doing two incompatible jobs: naming what a user is currently doing, and deciding what they are permitted to open. Once one value carries both meanings, every consequence follows — a prompt that has to fire before anything can render, dashboards that appear to close when a role is switched, and route protection that exists only as an absence of links.

### 1. The distinction

|  | `user.roles` | `activeRole` |
|---|---|---|
| **What it is** | The permanent set of roles the account registered for | The role the user is currently acting as |
| **Lifetime** | Permanent. Only ever grows (§8.1: adding a role never removes one) | Session-level, freely changed, remembered per account |
| **Stored** | On the account | `localStorage["activeRole:" + user.id]` |
| **Decides** | **Permissions.** Every route guard and permission check reads this and only this | **View context.** Which dashboard is shown, and which role-specific *actions* are offered |
| **Never decides** | Which dashboard is currently displayed | Whether a route may be opened |

Both are set in exactly one place (`lib/auth-context.tsx`) and read through one vocabulary file (`lib/roles.ts`), so no surface can invent a third interpretation.

### 2. Conditional role prompt — the rules

The prompt appears **only when there is a genuine choice to make**:

1. **One role** — auto-selected. Never prompted. The role switcher does not render at all.
2. **More than one role** — the saved preference at `localStorage["activeRole:" + user.id]` is restored if it is still a role the user holds, and the prompt is skipped. Otherwise the "Act as" screen is shown.
3. **On selection** — persist, then navigate to that role's landing page.

A saved preference that is no longer in `user.roles` is **discarded**, not merely ignored, and rule 2 is re-applied.

The preference deliberately **survives logout**. The previous model wiped it on sign-out, which is why a returning multi-role user was re-asked every time. A remembered answer is the mechanism that makes "only when there is a real choice" true across sessions, not only within one.

### 3. Landing pages

A landing page is a **post-login destination, not an access boundary**. Being sent somewhere says nothing about what else the account may open.

| Role | Lands on |
|---|---|
| Landlord | `/dashboard/landlord` |
| Tenant/Buyer (Renter) | `/listings` |
| Service Provider | `/dashboard/services` |
| Advertiser | `/dashboard/ads` |

Applies after sign-in, after answering the prompt, after switching role, and after adding a role.

### 4. Route access buckets

| Bucket | Who | Contains |
|---|---|---|
| **public** | anyone | Homepage, listings grid, the partial (teaser) listing detail |
| **shared** | any signed-in user, **whatever role they are acting as** | Full listing detail, enquire, save, `/dashboard`, `/dashboard/messages`, `/dashboard/notifications`, `/account` |
| **role-scoped** | `user.roles.includes(requiredRole)` | The four dashboards |

**Listings is shared, not Tenant/Buyer-scoped.** A Landlord-only account browses listings freely, and the Listings nav item stays visible to every signed-in user. This is stated explicitly because the natural mistake — treating browsing as the Renter's dashboard — would lock a landlord out of the product's main surface for holding the wrong role.

### 5. Role switcher

Header dropdown reading **"Viewing as: {role}"**. It renders only when `user.roles.length > 1` — checked against the permanent list, so it can never appear for a single-role account in any view context.

Changing role updates `activeRole`, persists it, **and navigates** to that role's landing page. It does not merely re-render the current page: a switch that leaves the user where they were is indistinguishable from no switch at all.

### 6. Edge cases

| Case | Resolution |
|---|---|
| Deep link to a role-scoped route while acting as a **different role the user also holds** | Switch `activeRole` automatically, announce it briefly, and let them through. Never block — they hold the role, and a view context should follow the user rather than argue with them. |
| Account does **not** hold the role | Block, naming the missing role specifically, with Add a Role (§8.1) as the way forward. |
| Role added later (1 → 2 roles) | The new role becomes active immediately and the user lands on its dashboard. Asking which role, one second after they said, is an echo rather than a choice. |
| Saved `activeRole` no longer in `user.roles` | Discard it and re-apply the rules in §2. |

### 7. Cross-role actions — enquire and save

**Any signed-in user may enquire and save, regardless of role.** No role check, and no prompt to add the Tenant/Buyer role first.

The alternative considered was to intercept a non-tenant with an offer to add the Tenant/Buyer role in one click. It was rejected because it contradicts §4: enquire and save are *shared* actions, and gating them on a role would make the shared bucket untrue at the two points where it matters most. A landlord who wants to message another landlord about a flat is behaving perfectly reasonably, and the account model already lets one person hold both roles precisely so this is not a wall.

### 8. What this amends, stated plainly

- **§8 above** said role switching is "accessible from the account/profile area" and described switching as changing dashboard context. It is now a persistent header control, and it navigates. (The header placement was already amended once by the client revision — REVISION_LOG.md §3.)
- **REVISION_LOG.md §4** recorded a once-per-*session* prompt held in `sessionStorage` and cleared on logout. It is now a conditional prompt with a per-account preference in `localStorage` that survives logout.
- **INFORMATION_ARCHITECTURE.md** listed dashboards as reachable by role without defining any enforcement. Role-scoped routes are now genuinely guarded; previously the only thing standing between a role and another role's routes was the sidebar not linking there.

Nothing else in this document is changed. The four-role list (§1), the account-level vs. role-level verification model (§6), Trust Layer reuse (§8.1), and the Renter/Buyer context decision are all untouched — this decision separates *selection* from *permission*, and touches neither the roles themselves nor their states.
