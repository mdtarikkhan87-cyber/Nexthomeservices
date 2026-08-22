# NextHome — User Journeys

**Status:** UX strategy — precedes information architecture and screen design.
**Sources used:** `NextHome_PRD_Phase1_Final.pdf`, `Next Home Brand Guidelines.pdf`, `NextHome_Final_TechStack.pdf`, [PRODUCT_UNDERSTANDING.md](PRODUCT_UNDERSTANDING.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [DESIGN_INTENT.md](DESIGN_INTENT.md).

No new features are introduced in this document. Every journey below maps to a capability already defined in the PRD or approved in PRODUCT_DECISIONS.md. Where a journey touches an unresolved item (already flagged as deferred/blocker in PRODUCT_DECISIONS.md), that is called out inline and repeated in the Journey Readiness Check at the end — not silently resolved.

---

## 1. Journey Index (Priority Classification)

### Public Visitor
| Journey | Priority |
|---|---|
| Landing on the website | Critical |
| Browsing property listings | Critical |
| Searching and filtering properties | Critical |
| Viewing property details | Critical |
| Viewing service listings | Important |
| Attempting a protected action (unauthenticated) | Critical |

### Authentication
| Journey | Priority |
|---|---|
| Opening login/register from a gated action | Critical |
| Role-aware registration | Critical |
| Completing role-appropriate verification | Critical |
| Returning to original context after authentication | Critical |
| Handling pending verification / restricted account states | Important |

### Tenant / Buyer
| Journey | Priority |
|---|---|
| Browsing properties | Critical |
| Searching/filtering properties | Critical |
| Viewing a property | Critical |
| Saving a property | Important |
| Messaging a landlord | Critical |
| Accessing and managing Saved Homes | Important |
| Accessing Messages | Critical |
| Switching roles (multi-role account) | Secondary |

### Landlord
| Journey | Priority |
|---|---|
| Registration and verification | Critical |
| Accessing the dashboard | Critical |
| Creating a property listing | Critical |
| Submitting a property for admin review | Critical |
| Handling listing states (pending/approved/rejected) | Critical |
| Subscription requirement before publishing | Critical |
| Managing listings | Important |
| Viewing listing performance (view counts) | Important |
| Messaging tenants | Critical |
| Switching roles (multi-role account) | Secondary |

### Service Provider
| Journey | Priority |
|---|---|
| Registration | Critical |
| Verification | Critical |
| Creating/managing a service listing | Critical |
| Handling listing status | Important |
| Messaging customers | Critical |
| Accessing role-specific dashboard | Important |

### Advertiser
| Journey | Priority |
|---|---|
| Browsing public content | Secondary (identical to Public Visitor journey) |
| Authentication for advertising actions | Critical |
| Accessing advertising dashboard/account functionality | Important |
| Managing the approved advertising workflow (submit → pending → approved/rejected) | Critical |

---

## 2. Detailed Journeys

Each journey below follows the same 15-point structure requested. Fields that don't add information for a given journey (e.g., "information required" on a purely navigational step) are kept brief rather than padded.

---

### PUBLIC VISITOR

#### Journey: Landing on the Website
1. **Priority:** Critical
2. **Role:** Public Visitor
3. **Trigger:** Direct visit, search engine referral, or shared link
4. **Goal:** Quickly determine whether the platform has relevant listings/providers
5. **Mindset:** Evaluative, comparing against known channels (WhatsApp groups, classifieds) they already distrust (PRD §2)
6. **Preconditions:** None — page must be fully public
7. **Step-by-step:**
   1. Visitor arrives at homepage
   2. Sees Rent/Sale mode toggle and search bar (PRD §4)
   3. Sees prominent "Post Property" CTA (always visible, for landlords, per PRD §4)
   4. Either searches immediately or scrolls to browse
8. **Information required:** None to enter yet — search bar, mode toggle, and (optionally) a snapshot of listings are the only inputs needed
9. **Decision points:** Rent vs. Sale mode; search now vs. browse
10. **Primary action:** Enter a search or begin browsing
11. **Friction/confusion:** None expected if the page is genuinely public with no interstitial login wall — DESIGN_INTENT.md §4 requires this
12. **Account/verification/subscription states:** None — always unauthenticated at this stage
13. **Success outcome:** Visitor proceeds to search or browse
14. **Failure/edge cases:** None applicable at this stage

---

#### Journey: Browsing Property Listings
1. **Priority:** Critical
2. **Role:** Public Visitor
3. **Trigger:** Visitor scrolls homepage or navigates to a listings view without a specific search
4. **Goal:** Get a general sense of available inventory
5. **Mindset:** Casual scanning, low commitment
6. **Preconditions:** None
7. **Step-by-step:**
   1. Visitor views a list/grid of listing cards
   2. Each card shows photo, price, location, bedroom count, Verified status, view count (PRD §4)
   3. Visitor scrolls or paginates through results
8. **Information required:** None from the user; system must always show verification status per card (DESIGN_INTENT.md Principle 1)
9. **Decision points:** Whether to filter/search, or open a specific listing
10. **Primary action:** Open a listing card
11. **Friction/confusion:** Ambiguous or missing trust signals on cards would undermine the entire premise — cards must never omit Verified status to save space
12. **Account/verification/subscription states:** None
13. **Success outcome:** Visitor opens a listing they're interested in, or refines via search
14. **Failure/edge cases:** No listings available for current mode/region — must show a clear empty state, not a blank page (gap noted in §5 friction analysis)

---

#### Journey: Searching and Filtering Properties
1. **Priority:** Critical
2. **Role:** Public Visitor (also applies identically to authenticated Tenant/Buyer)
3. **Trigger:** Visitor interacts with search bar or filter controls
4. **Goal:** Narrow listings to match specific needs (price, location, bedrooms, rent duration)
5. **Mindset:** Task-focused, wants immediate, accurate results
6. **Preconditions:** None
7. **Step-by-step:**
   1. Visitor selects Rent or Sale mode
   2. Visitor selects a state from the dropdown (not free text — PRD §4)
   3. Visitor sets price range and bedroom count
   4. Within Rent mode, visitor optionally applies Short-Term/Long-Term filter tag (PRD §4, §6.3)
   5. Results update (PRD §4 references "results updating instantly" as the desired pattern)
8. **Information required:** State (from fixed list), price range, bedroom count, optional rent-duration tag
9. **Decision points:** Which filters to apply; whether to broaden or narrow further
10. **Primary action:** Apply/adjust filters
11. **Friction/confusion:** If results don't update immediately, or if the Short-Term/Long-Term tag is presented as a separate listing type rather than a filter on the same Rent form (PRD §14 explicitly says it's a filter tag, not a separate model) — this distinction must be preserved in the UI
12. **Account/verification/subscription states:** None
13. **Success outcome:** Filtered result set the visitor can act on
14. **Failure/edge cases:** Zero results for a filter combination — needs a clear "no matches, try adjusting filters" state, not an empty grid

---

#### Journey: Viewing Property Details
1. **Priority:** Critical
2. **Role:** Public Visitor (also Tenant/Buyer)
3. **Trigger:** Visitor clicks/taps a listing card
4. **Goal:** Gather enough information and confidence to decide whether to contact the landlord
5. **Mindset:** Evaluative, looking for reasons to trust or distrust this specific listing
6. **Preconditions:** Listing must be in "live/approved" state to be publicly viewable at all
7. **Step-by-step:**
   1. Visitor lands on listing detail page
   2. Sees full photos, description, price, location, bedrooms, rent-or-sale type, Short-Term/Long-Term tag if applicable
   3. Sees view count and Verified badge
   4. Sees "Message Landlord" as the dominant action (DESIGN_INTENT.md §5)
   5. Visitor attempts to message or save → becomes a gated-action journey (see below)
8. **Information required:** None to view; message/save requires authentication
9. **Decision points:** Message now, save for later, or leave
10. **Primary action:** Message the landlord (dominant CTA per DESIGN_INTENT.md §5)
11. **Friction/confusion:** If Message and Save CTAs compete visually with equal weight, violates DESIGN_INTENT.md Principle 7 (one primary action per screen) — Message should be primary, Save secondary
12. **Account/verification/subscription states:** None required to view; required to message or save
13. **Success outcome:** Visitor either messages the landlord (triggering the gated-action flow) or saves the listing for later
14. **Failure/edge cases:** Listing was live when linked but has since been unpublished/expired — needs a clear "no longer available" state rather than a broken page

---

#### Journey: Viewing Service Listings
1. **Priority:** Important
2. **Role:** Public Visitor (also Tenant/Buyer or any authenticated user seeking a service)
3. **Trigger:** Visitor navigates to the Services section
4. **Goal:** Find a local trade service (electrician, plumber, mechanic, etc.)
5. **Mindset:** Similar to property browsing — evaluating legitimacy before contacting
6. **Preconditions:** Service listing must be admin-approved and live (PRD §6.7)
7. **Step-by-step:**
   1. Visitor browses or filters by service category (admin-managed category list, PRD §6.7)
   2. Visitor opens a provider's listing (service type, description, contact intent, photos if relevant)
   3. Visitor attempts to message the provider → gated-action flow
8. **Information required:** Category selection (from admin-managed list)
9. **Decision points:** Which category to browse; whether to contact a specific provider
10. **Primary action:** Message the service provider
11. **Friction/confusion:** Category list must feel current, not static — PRD confirms categories are admin-managed and can grow (PRD §6.7); an outdated-feeling list would undermine trust
12. **Account/verification/subscription states:** None to browse; authentication required to message
13. **Success outcome:** Visitor messages a provider (gated-action flow) or leaves with awareness of available services
14. **Failure/edge cases:** No providers in a selected category/region — clear empty state needed

---

#### Journey: Attempting a Protected Action (Unauthenticated)
1. **Priority:** Critical
2. **Role:** Public Visitor
3. **Trigger:** Visitor clicks Message, Save, Post Property, List a Service, or any dashboard-only control while unauthenticated
4. **Goal:** Complete the action they intended
5. **Mindset:** Was mid-task, does not expect to lose progress or context
6. **Preconditions:** Visitor is on a public page containing a protected-action control
7. **Step-by-step:** See full breakdown in **Section 3: Gated Action Behavior** below
8. **Information required:** None yet — system must capture the intended action + context before showing the auth prompt
9. **Decision points:** Log in (existing user) or register (new user)
10. **Primary action:** Complete authentication to proceed
11. **Friction/confusion:** Largest risk point in the entire product if handled poorly — full-page redirects, lost context, or generic "please log in" messaging (not naming the action) all violate DESIGN_INTENT.md §7 and Principle 2
12. **Account/verification/subscription states:** Transitions from unauthenticated → authenticated (see Section 4)
13. **Success outcome:** Visitor authenticates and the original action resumes or is clearly re-triggerable
14. **Failure/edge cases:** Visitor abandons the auth prompt — should return them cleanly to where they were, with no data loss (e.g., a drafted message)

---

### AUTHENTICATION

#### Journey: Opening Login/Register from a Gated Action
1. **Priority:** Critical
2. **Role:** Public Visitor → transitioning to any authenticated role
3. **Trigger:** Any protected-action attempt (see above)
4. **Goal:** Get authenticated with minimum disruption
5. **Mindset:** Wants to get back to what they were doing as fast as possible
6. **Preconditions:** A specific action + context has been captured (PRODUCT_DECISIONS.md §9)
7. **Step-by-step:**
   1. Inline modal opens over current context (not a full-page redirect — PRODUCT_DECISIONS.md §9)
   2. Modal names the action ("Log in to message this landlord")
   3. Modal offers Login and Register, with Register defaulting toward the role implied by the action (e.g., attempting "Post a Property" defaults to Landlord registration)
8. **Information required:** None yet at this step — just the choice of Login vs. Register
9. **Decision points:** Login (existing account) vs. Register (new account)
10. **Primary action:** Choose Login or Register
11. **Friction/confusion:** If the default role suggestion is wrong for a multi-intent user (e.g., someone who already has a Tenant account but is trying to list a property for the first time), the flow must still let them log in with their existing account rather than forcing a new registration
12. **Account/verification/subscription states:** unauthenticated only at this point
13. **Success outcome:** User proceeds to Login or Register flow
14. **Failure/edge cases:** User closes the modal — returns to public browsing with no action taken, no error state

---

#### Journey: Role-Aware Registration
1. **Priority:** Critical
2. **Role:** Public Visitor → new account holder
3. **Trigger:** User selects "Register" from the auth prompt
4. **Goal:** Create an account with the correct verification depth for their role
5. **Mindset:** Wants this to be short if possible (especially Tenant/Buyer); willing to invest more if the payoff is clear (Landlord/Service Provider paying for reach, or free listing)
6. **Preconditions:** Role is known — either explicitly selected by the user, or inferred from the triggering action
7. **Step-by-step:**
   1. Role is confirmed (auto-suggested from triggering action, user can change it)
   2. **If Tenant/Buyer:** phone OTP + email verification only (PRODUCT_DECISIONS.md §5) — no document upload, no mother's maiden name field
   3. **If Landlord or Service Provider:** full Basic Trust Layer — phone OTP, email verification, mother's maiden name, document upload (PRD §6.1)
   4. **If Advertiser:** phone OTP + email verification only (PRODUCT_DECISIONS.md §5) — no document upload, no full Basic Trust Layer; reaches "active advertiser account" immediately upon completion, same lightweight depth as Tenant/Buyer
8. **Information required:** Phone number, email, and (Landlord/Service Provider only) mother's maiden name + ID/utility bill document
9. **Decision points:** Confirm or change the suggested role before proceeding
10. **Primary action:** Complete the role-appropriate registration steps
11. **Friction/confusion:** Showing Trust-Layer-specific UI (document upload prompts) to a Tenant/Buyer would directly violate the approved lighter flow (PRODUCT_DECISIONS.md §5) and DESIGN_INTENT.md Principle 3
12. **Account/verification/subscription states:** unauthenticated → authenticated (unverified) → [Landlord/Service Provider] pending admin document review, OR [Tenant/Buyer, Advertiser] verified upon completing the lighter flow
13. **Success outcome:** Account created; user is authenticated and either immediately verified (Tenant/Buyer) or in pending-review state (Landlord/Service Provider)
14. **Failure/edge cases:** OTP delivery failure, invalid document upload format, duplicate account (same phone/email already registered) — all need explicit, specific error handling, not generic failure messages

---

#### Journey: Completing Role-Appropriate Verification
1. **Priority:** Critical
2. **Role:** Landlord, Service Provider (Tenant/Buyer and Advertiser complete verification as part of registration itself, with no separate step)
3. **Trigger:** Continuation of registration for a role requiring the full Basic Trust Layer
4. **Goal:** Get to a "verified" state so listing/service creation is unblocked
5. **Mindset:** Understands this is necessary for trust but wants clarity on how long it takes and what happens next
6. **Preconditions:** Phone OTP and email already confirmed
7. **Step-by-step:**
   1. User enters mother's maiden name (security/recovery field, PRD §6.1)
   2. User uploads ID photo or utility bill
   3. Submission enters "pending admin review" state
   4. User is returned to browsing/dashboard with a clear pending-state indicator (not blocked entirely — they can still browse, per DESIGN_INTENT.md public-browse philosophy)
8. **Information required:** Mother's maiden name, uploaded document file
9. **Decision points:** None — this is a linear required step for these roles
10. **Primary action:** Submit document for review
11. **Friction/confusion:** User must understand this does NOT mean their account is unusable — they can still browse and, per account state model, do things that don't require "verified" status; the interface must not present this as a hard wall
12. **Account/verification/subscription states:** authenticated (unverified) → pending admin document review → verified (once admin approves)
13. **Success outcome:** Admin approves the document; user's state moves to "verified" and listing/service creation is unblocked
14. **Failure/edge cases:** Admin rejects the document — user needs a clear reason and a path to resubmit (PRD doesn't explicitly define a resubmission flow — flagged in Readiness Check)

---

#### Journey: Returning to Original Context After Authentication
1. **Priority:** Critical
2. **Role:** Any newly authenticated user
3. **Trigger:** Completion of login or registration (registration completion, not necessarily full verification)
4. **Goal:** Resume the action they originally attempted, with minimal re-effort
5. **Mindset:** Expects to pick up exactly where they left off
6. **Preconditions:** Original action + context was captured at the point of interception (per Section 3)
7. **Step-by-step:** See Section 3 for the full state-by-state breakdown; summarized here:
   1. System checks whether the completed auth state satisfies the original action's requirement (login-only vs. login+verified vs. login+subscribed)
   2. If satisfied and the action is safe to auto-resume (e.g., reopening a message composer), it resumes automatically
   3. If the action has financial/side effects, user is returned to context but must explicitly re-initiate (PRODUCT_DECISIONS.md §10)
   4. If verification is still pending, the action remains blocked with a clear pending-state explanation, not a silent failure
8. **Information required:** None additional — reuses what was captured at interception
9. **Decision points:** None if auto-resumed; explicit re-confirmation if financial
10. **Primary action:** Resume/re-trigger the original action
11. **Friction/confusion:** The single highest-risk failure mode in this entire journey set is losing the original context (e.g., landing on the homepage instead of back at the specific listing) — this must be tested explicitly once implementation begins
12. **Account/verification/subscription states:** Whatever state resulted from the auth flow just completed
13. **Success outcome:** User completes (or is one click from completing) their original intended action
14. **Failure/edge cases:** Original context is no longer valid (e.g., listing was removed while they were registering) — needs a specific "this listing is no longer available" fallback, not a broken redirect

---

#### Journey: Handling Pending Verification or Restricted Account States
1. **Priority:** Important
2. **Role:** Landlord, Service Provider (primarily — these are the only roles with a document-review step). Advertiser accounts reach "role verified" immediately upon account-level email+phone verification (PRODUCT_DECISIONS.md §5) and so have no pending-review state of their own to handle here.
3. **Trigger:** User with a non-"verified"/non-"subscribed" account state attempts a role-specific action, or simply revisits their dashboard
4. **Goal:** Understand exactly what's blocking them and what to do about it
5. **Mindset:** Potentially frustrated if the reason isn't obvious — this is the point where trust in the platform itself is most tested
6. **Preconditions:** Account is authenticated but not in the state required for the attempted action
7. **Step-by-step:**
   1. User attempts a state-gated action (e.g., "Post a Property" while unsubscribed, or messaging while pending review, if messaging requires verified status — see Readiness Check on this exact rule)
   2. System identifies the specific unmet condition
   3. UI names the condition explicitly and offers the direct next step (e.g., "Subscribe to publish" vs. "Your documents are under review")
8. **Information required:** None from the user — system-driven state display
9. **Decision points:** Take the offered next step (subscribe, wait for review, resubmit documents) or leave
10. **Primary action:** Resolve the blocking condition (e.g., subscribe)
11. **Friction/confusion:** Conflating "pending review" and "unsubscribed" into one generic blocked state is an explicit anti-pattern per DESIGN_INTENT.md Principle 2 — these must always be visually and textually distinct
12. **Account/verification/subscription states:** Any non-terminal state in the model (Section 4)
13. **Success outcome:** User understands their state and either resolves it or consciously waits
14. **Failure/edge cases:** No defined timeframe for admin review exists in the PRD — user has no way to know if "pending" means minutes or days (flagged in Readiness Check)

---

### TENANT / BUYER

#### Journey: Browsing Properties / Searching / Viewing a Property (Authenticated)
1. **Priority:** Critical
2. **Role:** Tenant/Buyer
3. **Trigger:** Same as Public Visitor journeys above
4. **Goal:** Same as Public Visitor — these journeys are functionally identical whether authenticated or not, since browsing is never gated (PRODUCT_DECISIONS.md §2)
5. **Mindset:** Same as Public Visitor, with the addition that saved/messaged listings may now be visually indicated (e.g., a "Saved" state on a card they've already saved)
6. **Preconditions:** None beyond being logged in (optional)
7. **Step-by-step:** Identical to the Public Visitor versions above, with the addition that Save and Message actions no longer trigger the auth-interception flow — they execute directly
8. **Information required:** Same as Public Visitor journeys
9. **Decision points:** Same, plus now able to act on Save/Message immediately
10. **Primary action:** Message landlord (dominant CTA, unchanged from Public Visitor)
11. **Friction/confusion:** None beyond what's listed above
12. **Account/verification/subscription states:** authenticated (verified, since Tenant/Buyer reaches "verified" at registration per PRODUCT_DECISIONS.md §5) — no subscription state applies (Tenant/Buyer subscription capability exists in the system but is disabled at launch, PRD §6.6)
13. **Success outcome:** Same as Public Visitor, now with direct execution of Save/Message
14. **Failure/edge cases:** Same as Public Visitor journeys

---

#### Journey: Saving a Property
1. **Priority:** Important
2. **Role:** Tenant/Buyer
3. **Trigger:** User clicks "Save" on a listing card or detail page
4. **Goal:** Bookmark a listing for later comparison/decision, without committing to contact yet
5. **Mindset:** Still evaluating, not ready to message
6. **Preconditions:** User is authenticated (this is a gated action — PRODUCT_DECISIONS.md §3, §4.1)
7. **Step-by-step:**
   1. Unauthenticated user clicks Save → gated-action flow (Section 3)
   2. Authenticated user clicks Save → listing is added to Saved Homes immediately, with visible confirmation
   3. User can unsave from the same control (toggle)
8. **Information required:** None
9. **Decision points:** Save vs. not; later, keep saved vs. unsave
10. **Primary action:** Toggle save state
11. **Friction/confusion:** Should be a lightweight, low-friction action — per DESIGN_INTENT.md §5, Save is secondary to Message and must never visually compete with it
12. **Account/verification/subscription states:** authenticated (verified) required; this is a newly approved feature (PRODUCT_DECISIONS.md §4.1) with no additional state requirements defined
13. **Success outcome:** Listing appears in Saved Homes
14. **Failure/edge cases:** Saved listing later becomes unavailable/unpublished — Saved Homes view needs to handle this gracefully (e.g., show as "no longer available" rather than a broken link)

---

#### Journey: Messaging a Landlord
1. **Priority:** Critical
2. **Role:** Tenant/Buyer
3. **Trigger:** User clicks "Message Landlord" on a listing detail page
4. **Goal:** Start a conversation to express interest / ask questions about a specific listing
5. **Mindset:** This is the primary conversion moment — the user has decided this listing is worth pursuing
6. **Preconditions:** Authentication required (gated action); listing must be live
7. **Step-by-step:**
   1. Unauthenticated user clicks Message → gated-action flow
   2. Authenticated user opens message composer, tied to the specific listing (PRD §6.4)
   3. On-screen reminder encourages keeping communication in-app (PRD §6.4)
   4. Message sent; appears in landlord's dashboard "instantly" per PRD §6.3
8. **Information required:** Message text
9. **Decision points:** What to say; whether to share contact info off-platform (system can flag but not block this per PRD §6.4)
10. **Primary action:** Send message
11. **Friction/confusion:** If message screening (flagging phone/email in message text) is too aggressive or unclear, it could feel like censorship rather than a soft nudge — PRD explicitly frames this as a warning, not a block (§6.4)
12. **Account/verification/subscription states:** authenticated (verified) required — Tenant/Buyer has no subscription gate on messaging (PRD §6.6, free in Phase 1)
13. **Success outcome:** Message delivered, conversation thread created, tied to the listing
14. **Failure/edge cases:** Landlord's listing is later removed/unpublished mid-conversation — thread should remain accessible for record-keeping (PRD §6.4 frames messaging as a dispute-resolution record) even if the listing is gone

---

#### Journey: Accessing and Managing Saved Homes
1. **Priority:** Important
2. **Role:** Tenant/Buyer
3. **Trigger:** User navigates to "Saved Homes" from their dashboard
4. **Goal:** Review and compare previously saved listings; remove ones no longer of interest
5. **Mindset:** Comparison/decision mode, later in the funnel than initial browsing
6. **Preconditions:** Authenticated; at least implicitly has saved something (empty state otherwise)
7. **Step-by-step:**
   1. User opens Saved Homes from dashboard
   2. Sees list of saved listings (same card treatment as browsing, per DESIGN_INTENT.md consistency principle)
   3. Can unsave, or click through to a listing detail / message the landlord
8. **Information required:** None
9. **Decision points:** Which saved listing to act on; unsave vs. keep
10. **Primary action:** Open a saved listing or message its landlord
11. **Friction/confusion:** None specific beyond the general listing-unavailable edge case (see Saving a Property journey)
12. **Account/verification/subscription states:** authenticated (verified)
13. **Success outcome:** User finds and acts on a saved listing, or curates their saved list
14. **Failure/edge cases:** No saved homes yet — needs a clear empty state pointing back to browsing

---

#### Journey: Accessing Messages
1. **Priority:** Critical
2. **Role:** Tenant/Buyer
3. **Trigger:** User navigates to "Messages" from their dashboard
4. **Goal:** Review ongoing conversations with landlords, respond to replies
5. **Mindset:** Task-focused — checking for responses, continuing conversations
6. **Preconditions:** Authenticated; this replaces the earlier "Property Applications" concept — messaging-only model (PRODUCT_DECISIONS.md §4.2)
7. **Step-by-step:**
   1. User opens Messages
   2. Sees list of conversation threads, each tied to a specific listing
   3. Opens a thread to read/reply
8. **Information required:** Reply text, if responding
9. **Decision points:** Which thread to open/respond to
10. **Primary action:** Reply to a message
11. **Friction/confusion:** If this were mislabeled or structured as a formal "application" with status states, it would misrepresent what's actually happening (a message thread, not an application) — must stay consistent with PRODUCT_DECISIONS.md §4.2
12. **Account/verification/subscription states:** authenticated (verified)
13. **Success outcome:** User reads/responds to landlord messages
14. **Failure/edge cases:** Landlord never responds — no defined escalation path in the PRD beyond the general Complaints system (PRD §8.3), which is a separate, deliberate action the user would take, not automatic

---

#### Journey: Switching Roles (Multi-Role Account)
1. **Priority:** Secondary
2. **Role:** Tenant/Buyer with an additional role on the same account (e.g., also a Landlord)
3. **Trigger:** User opens account/profile area and selects a different active role
4. **Goal:** Move from Tenant/Buyer context to a different role's dashboard without creating a new account
5. **Mindset:** Managing multiple relationships to the platform under one identity
6. **Preconditions:** Account already holds more than one role (PRODUCT_DECISIONS.md §4, §8); if adding a new role for the first time, see note below
7. **Step-by-step:**
   1. User opens account/profile area
   2. Selects role-switch control
   3. Chooses the target role
   4. Dashboard and navigation context change entirely to reflect the new active role; a persistent indicator confirms which role is now active (DESIGN_INTENT.md §7)
8. **Information required:** None if the role is already added; if adding a new role for the first time, that role's registration/verification requirements apply (see note)
9. **Decision points:** Which role to switch to
10. **Primary action:** Confirm role switch
11. **Friction/confusion:** Must not require re-authentication or feel like logging into a different product (DESIGN_INTENT.md anti-pattern list) — this is a context change, not a new session
12. **Account/verification/subscription states:** Each role carries its own independent state (a Tenant/Buyer role can be "verified" while an added Landlord role on the same account is "pending admin document review")
13. **Success outcome:** User is now operating in the newly active role's dashboard/nav context
14. **Failure/edge cases:** None — resolved. Adding a brand-new second role reuses the account's already-verified email and phone; only the new role's own additional requirements (e.g., mother's maiden name + document upload if adding Landlord/Service Provider) are requested, and only the new role enters a pending state — existing roles remain fully usable throughout (PRODUCT_DECISIONS.md §8.1)

---

### LANDLORD

#### Journey: Registration and Verification
Covered in full under **Authentication → Role-Aware Registration** and **Completing Role-Appropriate Verification** above (Landlord follows the full Basic Trust Layer path). Not repeated here to avoid duplication.

---

#### Journey: Accessing the Dashboard
1. **Priority:** Critical
2. **Role:** Landlord
3. **Trigger:** User logs in or navigates to their dashboard
4. **Goal:** See current status of listings, messages, and account at a glance
5. **Mindset:** Status-check mode — "is anything happening that needs my attention"
6. **Preconditions:** Authenticated (any verification/subscription state — dashboard itself is always accessible once authenticated)
7. **Step-by-step:**
   1. User lands on Landlord dashboard
   2. Sees: My Listings, Post a Property, Subscription/Billing status, Tenant Messages, listing performance, account/Trust Layer status (PRODUCT_DECISIONS.md §7)
   3. Most urgent items (unread messages, rejected listings, pending payment) are prioritized in layout (DESIGN_INTENT.md §4 dashboard density guidance)
8. **Information required:** None to view
9. **Decision points:** Which area to act on first
10. **Primary action:** Post a Property, or respond to messages (DESIGN_INTENT.md §5 — Landlord's core loop)
11. **Friction/confusion:** A dashboard that buries pending/urgent items below promotional content is an explicit anti-pattern (DESIGN_INTENT.md §9)
12. **Account/verification/subscription states:** Any — dashboard content adapts to show relevant state (e.g., subscribe CTA if unsubscribed, review-pending notice if awaiting document approval)
13. **Success outcome:** Landlord understands their current status and proceeds to the relevant action
14. **Failure/edge cases:** New landlord with no listings yet — needs a clear first-time empty state guiding them to "Post a Property"

---

#### Journey: Creating a Property Listing
1. **Priority:** Critical
2. **Role:** Landlord
3. **Trigger:** User clicks "Post a Property" / "List a Property"
4. **Goal:** Get a complete, accurate listing submitted as quickly as possible
5. **Mindset:** Motivated but cost-aware (knows a subscription is required, PRD §6.5) — wants to know upfront, not be surprised later
6. **Preconditions:** Authenticated; verified status not strictly required to *fill in* listing details, but publishing requires both verified + subscribed (see state model, Section 4)
7. **Step-by-step:**
   1. User selects Rent or Sale
   2. Fills in address, price, bedrooms, description, uploads photos (PRD §6.2)
   3. If Rent, tags as Short-Term or Long-Term (PRD §6.2)
   4. If Sale, enters one-time sale price instead of recurring rent (PRD §14 assumption)
   5. Listing is saved but marked "pending" — not visible to tenants/buyers yet (PRD §6.2)
8. **Information required:** Address, price, bedroom count, description, photos, rent/sale type, duration tag if applicable
9. **Decision points:** Rent vs. Sale; Short-Term vs. Long-Term (if Rent)
10. **Primary action:** Submit listing for review
11. **Friction/confusion:** PRD success criterion is <5 minutes for Trust Layer + listing post combined (PRD §13) — form should be a single, efficient flow with no unnecessary steps, per Design Principle 4 (transparency, not friction) at the point where payment is introduced
12. **Account/verification/subscription states:** Listing can be drafted in any state, but publishing requires verified (admin-approved documents) + subscribed (payment complete) — see Section 4
13. **Success outcome:** Listing submitted and marked pending, or (if not yet subscribed) user is directed to subscribe before it can go live
14. **Failure/edge cases:** User completes listing details but isn't yet verified or subscribed — must be told exactly which condition is blocking publication, not a generic "cannot publish" message

---

#### Journey: Submitting a Property for Admin Review
1. **Priority:** Critical
2. **Role:** Landlord
3. **Trigger:** Continuation of listing creation, after payment (if not already subscribed) or immediately (if already subscribed)
4. **Goal:** Get the listing live as soon as possible
5. **Mindset:** Waiting/anticipatory
6. **Preconditions:** Listing details complete, subscription active
7. **Step-by-step:**
   1. Listing enters "pending" state (PRD §6.2)
   2. Admin is notified, reviews, approves or rejects (PRD §6.2)
   3. Landlord is notified of the outcome
8. **Information required:** None further from the landlord at this stage
9. **Decision points:** None — outcome is admin-controlled
10. **Primary action:** None (wait state) — landlord's only action here is to check status
11. **Friction/confusion:** No defined SLA/timeframe for admin review exists in the PRD — landlord has no way to know if "pending" means minutes or days (same gap flagged under Authentication journeys)
12. **Account/verification/subscription states:** Listing-level state: pending → approved (live) or rejected — independent of the landlord's own account verification/subscription state, which must already be satisfied to reach this point
13. **Success outcome:** Listing approved, goes live, begins collecting view count (PRD §6.2)
14. **Failure/edge cases:** Listing rejected — landlord needs a clear reason and a path to edit and resubmit (PRD doesn't explicitly define this resubmission mechanism — flagged in Readiness Check)

---

#### Journey: Handling Pending, Approved, Rejected, and Other Listing States
1. **Priority:** Critical
2. **Role:** Landlord
3. **Trigger:** Landlord views "My Listings"
4. **Goal:** Understand exactly where each listing stands
5. **Mindset:** Status-check, wants unambiguous state per DESIGN_INTENT.md Principle 2
6. **Preconditions:** At least one listing created
7. **Step-by-step:**
   1. Landlord opens My Listings
   2. Each listing shows one explicit state: pending review, live, or rejected (PRD §6.2)
   3. Landlord can view detail, edit (if state allows), or view performance (if live)
8. **Information required:** None to view
9. **Decision points:** Which listing to act on
10. **Primary action:** Edit/resubmit (rejected), view performance (live), or simply monitor (pending)
11. **Friction/confusion:** States must never be blended or implied — this is a direct application of DESIGN_INTENT.md Principle 2 to listings specifically
12. **Account/verification/subscription states:** Listing state is independent of but gated by account-level verified/subscribed state (a lapsed subscription could affect a live listing's continued visibility — **not explicitly defined in the PRD**, flagged in Readiness Check)
13. **Success outcome:** Landlord has full clarity on every listing's status
14. **Failure/edge cases:** Subscription lapses while a listing is live — PRD does not define what happens to the listing in this case (flagged in Readiness Check)

---

#### Journey: Subscription Requirement Before Publishing
1. **Priority:** Critical
2. **Role:** Landlord
3. **Trigger:** Landlord attempts to publish a listing (first listing or any subsequent one) without an active subscription
4. **Goal:** Understand the cost and complete payment to unblock publishing
5. **Mindset:** This is the platform's core monetization moment and a known point of friction/drop-off risk — user needs full transparency (Design Principle 4)
6. **Preconditions:** Listing details complete; no free tier exists (PRD §6.5)
7. **Step-by-step:**
   1. Landlord reaches the point of publishing and is shown subscription pricing (admin-configurable, including promotions — PRD §6.5)
   2. Landlord selects payment method: Stripe, Paystack, or bank transfer, with country-based routing applied automatically and invisibly (PRD §7)
   3. **Card payment (Stripe/Paystack):** processed immediately, account instantly upgraded (PRD §6.5)
   4. **Bank transfer:** payment must be matched to the landlord's account, confirmed automatically or via admin check, before activation (PRD §6.5, §7)
8. **Information required:** Payment method, payment details (never stored by the platform itself — PRD §6.5)
9. **Decision points:** Card/Paystack (instant) vs. bank transfer (delayed activation)
10. **Primary action:** Complete payment
11. **Friction/confusion:** Bank transfer users need to clearly understand their listing won't go live *immediately* — this delayed-activation path must be communicated distinctly from the instant card/Paystack path, or it will read as a broken payment
12. **Account/verification/subscription states:** subscription inactive → subscription active (instant for card/Paystack, delayed for bank transfer pending admin confirmation)
13. **Success outcome:** Subscription active; listing can now proceed to admin content review (a separate, already-covered step)
14. **Failure/edge cases:** Payment fails (declined card, etc.) — needs a specific, named reason where the provider supplies one (Design Principle: no raw technical errors surfaced, per DESIGN_INTENT.md §7)

---

#### Journey: Managing Listings
1. **Priority:** Important
2. **Role:** Landlord
3. **Trigger:** Landlord wants to edit, unpublish, or review an existing listing
4. **Goal:** Keep listings accurate and current
5. **Mindset:** Maintenance mode
6. **Preconditions:** At least one listing exists
7. **Step-by-step:**
   1. Landlord opens a listing from My Listings
   2. Edits details or unpublishes
   3. Material edits may require re-review (**not explicitly defined in the PRD whether an edit to a live listing re-triggers admin approval** — flagged in Readiness Check)
8. **Information required:** Whatever fields are being edited
9. **Decision points:** Edit vs. unpublish
10. **Primary action:** Save changes
11. **Friction/confusion:** Unpublish is a destructive-leaning action (removes visibility) and should be styled distinctly from primary actions per DESIGN_INTENT.md §5
12. **Account/verification/subscription states:** Requires active subscription to keep a listing live; editing itself likely doesn't require re-subscription (assumption — not explicitly stated)
13. **Success outcome:** Listing updated or unpublished as intended
14. **Failure/edge cases:** See re-review ambiguity above

---

#### Journey: Viewing Listing Performance (View Counts)
1. **Priority:** Important
2. **Role:** Landlord
3. **Trigger:** Landlord opens a live listing's detail/performance view
4. **Goal:** Gauge whether the listing is attracting interest (PRD §4)
5. **Mindset:** Evaluating ROI on their subscription
6. **Preconditions:** Listing must be live (view counts only accrue once approved, PRD §6.2)
7. **Step-by-step:**
   1. Landlord opens a live listing from My Listings
   2. Sees view count
8. **Information required:** None to view
9. **Decision points:** Whether the performance justifies edits, or none
10. **Primary action:** None required — informational
11. **Friction/confusion:** None specific
12. **Account/verification/subscription states:** Requires listing to be live (verified + subscribed + admin-approved)
13. **Success outcome:** Landlord has visibility into interest level
14. **Failure/edge cases:** New listing with zero views yet — should read as "not enough data yet," not a discouraging zero

---

#### Journey: Messaging Tenants
Functionally the mirror of the Tenant/Buyer "Messaging a Landlord" and "Accessing Messages" journeys above — landlord sees incoming messages tied to specific listings in their dashboard "instantly" (PRD §6.3) and replies from there. Not repeated in full to avoid duplication; same friction/state considerations apply symmetrically.

---

#### Journey: Switching Roles (Multi-Role Account)
Same mechanism as the Tenant/Buyer version above — a Landlord with an additional role switches via the account/profile area. If adding a new role that requires the Basic Trust Layer, already-verified account-level email/phone are reused and only the new role's additional requirements are requested (PRODUCT_DECISIONS.md §8.1); existing roles remain fully active throughout.

---

### SERVICE PROVIDER

#### Journey: Registration and Verification
Follows the same full Basic Trust Layer path as Landlord registration (PRD §6.1, §6.7) — covered under Authentication journeys above. Not repeated in full.

---

#### Journey: Creating/Managing a Service Listing
1. **Priority:** Critical
2. **Role:** Service Provider
3. **Trigger:** User completes verification and creates a service listing, or edits an existing one
4. **Goal:** Get discovered by nearby customers, free of charge (PRD §6.7)
5. **Mindset:** Motivated, no cost-friction concern (unlike Landlord) since listing is free in Phase 1
6. **Preconditions:** Authenticated; verified status required before the listing can go live (same admin-approval pattern as property listings, PRD §6.7)
7. **Step-by-step:**
   1. User selects a service category (admin-managed list, PRD §6.7)
   2. Fills in description, contact details, photos if relevant
   3. Listing enters pending state, admin reviews
8. **Information required:** Service category, description, contact details, optional photos
9. **Decision points:** Which category best fits
10. **Primary action:** Submit listing
11. **Friction/confusion:** No subscription gate here (unlike Landlord) — the interface must not accidentally imply a payment step exists, since it explicitly does not in Phase 1 (PRD §6.7, §14)
12. **Account/verification/subscription states:** No subscription state applies; only verified (admin document review) and listing-level pending/approved/rejected apply
13. **Success outcome:** Listing submitted, later approved and live
14. **Failure/edge cases:** Listing rejected — same resubmission ambiguity flagged for Landlord listings

---

#### Journey: Handling Listing Status
Same pattern as the Landlord "Handling Pending, Approved, Rejected" journey, without the subscription dimension. Not repeated in full.

---

#### Journey: Messaging Customers
Same mechanism as Landlord messaging tenants — customers (any authenticated user) message the provider, tied to the service listing, and the provider responds from their dashboard (PRD §6.4, applies "the same in-app messaging" to service providers).

---

#### Journey: Accessing Role-Specific Dashboard
1. **Priority:** Important
2. **Role:** Service Provider
3. **Trigger:** User logs in / navigates to dashboard
4. **Goal:** Check listing status and messages
5. **Mindset:** Status-check, same as Landlord dashboard mindset
6. **Preconditions:** Authenticated
7. **Step-by-step:** Sees My Service Listing (status), Customer Messages, Account/Trust Layer status (PRODUCT_DECISIONS.md §7)
8. **Information required:** None to view
9. **Decision points:** Which area to act on
10. **Primary action:** Respond to messages (core loop, DESIGN_INTENT.md §5)
11. **Friction/confusion:** None beyond general dashboard-density guidance already covered
12. **Account/verification/subscription states:** Any — no subscription state applies to this role
13. **Success outcome:** Provider understands their status and acts accordingly
14. **Failure/edge cases:** No listing created yet — clear first-time empty state needed

---

### ADVERTISER

#### Journey: Browsing Public Content
Identical to the Public Visitor journeys (Landing, Browsing, Searching, Viewing Details/Service Listings) — an Advertiser has no distinct browsing behavior before they decide to act on the advertising workflow specifically. Not repeated.

---

#### Journey: Authentication for Advertising Actions
1. **Priority:** Critical
2. **Role:** Advertiser
3. **Trigger:** User attempts to create, submit, manage, pay for, or view account-specific advertising activity (PRODUCT_DECISIONS.md §3)
4. **Goal:** Get authenticated with minimum friction to submit an ad
5. **Mindset:** Self-serve, outcome-focused (PRD §9 — "self-serve submission form")
6. **Preconditions:** None beyond attempting an advertising-specific action
7. **Step-by-step:** Follows the same gated-action interception pattern as any other role (Section 3) — auth prompt names the action, defaults toward Advertiser registration
8. **Information required:** Whatever the standard account-creation flow requires
9. **Decision points:** Login vs. Register
10. **Primary action:** Authenticate
11. **Friction/confusion:** None — resolved. Advertiser registration uses the same lightweight phone OTP + email flow as Tenant/Buyer (PRODUCT_DECISIONS.md §5); ad *content* review (PRD §9) remains a separate, later step and must be presented as distinct from account verification in the UI
12. **Account/verification/subscription states:** unauthenticated → authenticated (account-level email + phone verified) → active advertiser account (role-level verified — no document-review step applies, PRODUCT_DECISIONS.md §5)
13. **Success outcome:** Advertiser account created/authenticated, proceeds to ad submission
14. **Failure/edge cases:** Same general registration failure modes as other roles (OTP failure, duplicate account, etc.)

---

#### Journey: Accessing Advertising-Specific Account/Dashboard Functionality
1. **Priority:** Important
2. **Role:** Advertiser
3. **Trigger:** User navigates to their advertising dashboard
4. **Goal:** Check status of submitted ads, manage billing
5. **Mindset:** Status-check, same pattern as other roles
6. **Preconditions:** Authenticated
7. **Step-by-step:** Sees My Advertisements (submitted/pending/live/rejected), ad payment/billing status, account/profile settings (PRODUCT_DECISIONS.md §7)
8. **Information required:** None to view
9. **Decision points:** Which ad to manage
10. **Primary action:** Submit a new ad (core loop, DESIGN_INTENT.md §2)
11. **Friction/confusion:** Approval status must be as legible as it is for listings — ads go through the same admin-review pattern (PRD §9) and must use the same explicit state language (pending/approved/rejected), not a separate, inconsistent vocabulary
12. **Account/verification/subscription states:** authenticated (account-level email+phone verified) → active advertiser account (role verified — no document-review step, PRODUCT_DECISIONS.md §5)
13. **Success outcome:** Advertiser has full visibility into their ad status and can manage billing
14. **Failure/edge cases:** No ads submitted yet — clear empty state pointing to ad submission

---

#### Journey: Managing the Approved Advertising Workflow
1. **Priority:** Critical
2. **Role:** Advertiser
3. **Trigger:** Authenticated advertiser submits a new ad
4. **Goal:** Get an ad approved and placed
5. **Mindset:** Outcome-focused, wants clarity on cost/placement/duration before committing
6. **Preconditions:** Authenticated; admin controls placement, duration, and cost (PRD §9)
7. **Step-by-step:**
   1. Advertiser submits ad creative (image, text, link) via self-serve form (PRD §9)
   2. Ad enters pending admin review (PRD §9)
   3. Admin decides placement, duration, cost — potentially using the same flexible/promotional pricing engine as subscriptions (PRD §9)
   4. Advertiser is presented with resulting cost and, presumably, a payment step (PRD implies ads are paid, §9, but does not fully specify whether pricing is shown to the advertiser *before* submission or only *after* admin sets terms — flagged in Readiness Check)
8. **Information required:** Ad image, text, link
9. **Decision points:** Whether to proceed with payment once terms are set by admin
10. **Primary action:** Submit ad; later, complete payment
11. **Friction/confusion:** If cost/placement/duration are only determined *after* submission (admin sets these per PRD §9), the advertiser experience must clearly explain this isn't instant self-checkout — it's submit-then-admin-terms-then-pay, which is a different mental model than a typical self-serve ad platform and must be communicated upfront to avoid frustration
12. **Account/verification/subscription states:** active advertiser account (role verified, PRODUCT_DECISIONS.md §5); ad-level state (pending/approved/rejected) is a separate, content-item-level layer beneath this and independent of it
13. **Success outcome:** Ad approved, placed, and (once paid) live
14. **Failure/edge cases:** Ad rejected — same resubmission ambiguity flagged for listings and service listings

---

## 3. Gated Action Behavior

This is the canonical flow referenced by every "Attempting a Protected Action" journey above.

```
1. PUBLIC BROWSING
   User is on any public page (listing, search results, service directory).

2. USER ATTEMPTS PROTECTED ACTION
   Examples: Message, Save, Post a Property, List a Service, submit/manage an ad,
   access any dashboard.
   → System captures: the specific action intended + the exact context
     (e.g., "message landlord about Listing #123", not just "Listing #123 page").

3. AUTHENTICATION PROMPT
   Inline modal opens over current context (never a full-page redirect).
   Modal names the action explicitly ("Log in to message this landlord").
   Offers Login and Register; Register defaults toward the role implied by the action.

4. LOGIN OR REGISTRATION
   → Login: existing users proceed directly to step 5.
   → Registration: role-appropriate flow runs (see Role-Aware Registration journey).
     - Tenant/Buyer: phone OTP + email only → reaches "verified" immediately.
     - Landlord/Service Provider: full Basic Trust Layer → reaches
       "pending admin document review", NOT yet "verified".
     - Advertiser: phone OTP + email only → reaches "active advertiser account" immediately, same depth as Tenant/Buyer (PRODUCT_DECISIONS.md §5).

5. VERIFICATION / STATE CHECK
   System checks whether the account's current state satisfies the ORIGINAL
   action's specific requirement:
     - Some actions require only "authenticated" (e.g., messaging, for most roles).
     - Some actions require "verified" (e.g., publishing a listing, submitting a
       service listing for review).
     - Some actions require "verified" AND "subscribed" (e.g., a Landlord
       publishing a property listing).
   → If the requirement is met: proceed to step 6.
   → If not met: user is shown the SPECIFIC unmet condition (see "Handling
     Pending Verification" journey) — action stays blocked, but clearly and
     explicitly, not silently.

6. RETURN TO ORIGINAL CONTEXT
   User is returned to the exact page/state they were on before interception.

7. RESUME ACTION WHERE SAFE
   → No side effects (e.g., reopening a message composer, showing the Saved
     Homes confirmation): action resumes/auto-triggers automatically.
   → Financial or otherwise consequential actions (e.g., a subscription payment,
     ad payment): user is returned to context but must explicitly re-initiate
     the action — never auto-charged or auto-submitted (PRODUCT_DECISIONS.md §10).
```

**Why the financial-action distinction matters:** Auto-resuming a message compose after login is a convenience with no downside. Auto-resuming a payment after a multi-step registration flow (which may have taken the user several minutes and multiple context switches) risks the user being charged for something they no longer have fresh in mind, and undermines the transparency principle in DESIGN_INTENT.md §3/§6. The extra click to re-confirm is a deliberate trust safeguard, not an oversight.

---

## 4. Role and Account State Model

Per PRODUCT_DECISIONS.md §6, this model has **two independent layers**: account-level state (shared identity facts — email, phone) and role-level state (tracked separately per role held by the account). A content item (a specific listing, service listing, or ad) carries a further, still-separate pending/approved/rejected state beneath its role.

```
ACCOUNT-LEVEL STATE (shared across every role on the account)

UNAUTHENTICATED
  Can: browse, search, view listings/service listings/ads publicly.
  Cannot: message, save, post/list anything, access any dashboard.

  ↓ (registration or login)

AUTHENTICATED (email + phone OTP verified)
  This is the account-level ceiling for Tenant/Buyer and Advertiser roles —
  reaching this state alone satisfies their full requirement (PRODUCT_DECISIONS.md §5).
  For Landlord/Service Provider roles, this state is necessary but not sufficient —
  see role-level state below.
  Once reached, email + phone are permanently reusable for any role later added
  to this account — never re-collected (PRODUCT_DECISIONS.md §8.1).


ROLE-LEVEL STATE (tracked independently per role held by the account)

ROLE ADDED (inherits account-level email + phone verification automatically)
  Can (Tenant/Buyer, Advertiser): everything their role permits — see role
    definitions below — immediately, no further step required.
  Can (Landlord, Service Provider): browse, access dashboard, draft a listing/
    service; cannot yet submit for admin review — additional role-specific
    requirements are outstanding (mother's maiden name, document upload).

  ↓ (Landlord/Service Provider only: submit mother's maiden name + document)

PENDING ADMIN DOCUMENT REVIEW  [Landlord, Service Provider roles only]
  Can: browse, message (messaging's exact verification requirement is not
    explicitly stated in the PRD — flagged as IMPORTANT below), access dashboard,
    draft a listing. Any OTHER role already held by this account is entirely
    unaffected and remains fully usable (PRODUCT_DECISIONS.md §8.1).
  Cannot: have a listing/service go live (requires admin approval, which itself
    requires this role to first resolve to "role verified").

  ↓ (admin approves document)

ROLE VERIFIED
  Applies to: every role, once its own requirement is met —
    Tenant/Buyer, Advertiser: immediately upon account-level authentication;
    Landlord, Service Provider: after admin document approval.
  Can: submit listings/services for admin review; message; save (Tenant/Buyer).
  Cannot (Landlord only): publish a listing until also subscribed.

  ↓ (Landlord only: complete payment)

SUBSCRIPTION INACTIVE → SUBSCRIPTION ACTIVE  [Landlord role only]
  Inactive: role verified but cannot publish any listing (no free tier, PRD §6.5).
  Active: instant for card/Paystack payment; delayed, pending admin bank-transfer
    confirmation, for bank transfer (PRD §6.5, §7).
  Can (once active): publish listings (still subject to per-listing admin
    content approval — a separate, content-item-level state, not this
    role-level subscription state).


CONTENT-ITEM-LEVEL STATE (a specific listing / service listing / ad)
  pending admin review → approved (live) or rejected
  Independent of, and layered beneath, the role-level state above — e.g. a
  fully "role verified" and "subscription active" Landlord can still have an
  individual listing sitting in "pending" content review (PRD §6.2); a fully
  "role verified" Advertiser can still have an individual ad in "pending"
  content review (PRD §9).


ROLE CONTEXT SWITCHING  [any multi-role account]
  A single account can hold multiple roles simultaneously; each role's
  role-level state above is tracked and evaluated independently.
  Only one role is "active" at a time for dashboard/navigation purposes.
  Switching roles does not require re-authentication and does not reset any
  role's individual state. Adding a new role never re-collects account-level
  email/phone verification, and never restricts an already-verified/active
  role while the new role's own requirements are pending (PRODUCT_DECISIONS.md §8.1).
```

**What a user can/cannot do, summarized per state:**

| State | Browse | Message | Save (Tenant/Buyer) | Submit listing/service/ad for review | Publish/go live |
|---|---|---|---|---|---|
| Unauthenticated | Yes | No | No | No | No |
| Account authenticated, role added (Tenant/Buyer, Advertiser) | Yes | Yes | Yes | Yes (Advertiser: ad submission) | N/A (Tenant/Buyer, Advertiser don't "publish" in this sense) |
| Role added, additional requirements outstanding (Landlord/Service Provider) | Yes | *Undefined — see IMPORTANT below* | N/A (not applicable to this role) | No | No |
| Pending admin document review (Landlord/Service Provider) | Yes | *Undefined — see IMPORTANT below* | N/A | No | No |
| Role verified | Yes | Yes | Yes (Tenant/Buyer) | Yes | No (Landlord: also needs subscription) |
| Subscription active (Landlord) | Yes | Yes | N/A | Yes | Yes (pending per-listing content-level admin approval) |

A user's *other* already-verified/active roles are unaffected by any single role's row above — each row describes that one role's own state only (PRODUCT_DECISIONS.md §8.1).

---

## 5. Cross-Journey Friction Analysis

**Repeated friction points:**
- The "pending admin review" state appears in five distinct journeys (Landlord document review, Landlord listing review, Service Provider listing review, Advertiser ad review) with **no defined timeframe** anywhere in the PRD. This is the single most repeated open gap across the entire journey set.
- "Rejected" states (documents, listings, service listings, ads) appear repeatedly with **no defined resubmission mechanism** described in the PRD. Every rejection journey above independently hits this same gap.

**Unnecessary steps:**
- None identified that aren't already required by the approved PRD/decisions — the registration-depth split (light for Tenant/Buyer, full Trust Layer for Landlord/Service Provider) already removes the most obvious potential friction point.

**Potential user confusion:**
- Advertiser pricing model (submit ad → admin sets placement/duration/cost → then pay) is a non-obvious mental model compared to typical instant self-serve ad platforms; this needs to be communicated clearly at the point of ad submission, not discovered after the fact.
- Bank-transfer subscription activation is delayed relative to card/Paystack — must be visually and textually distinguished so it doesn't read as a failed payment.

**Places where users may lose context:**
- The gated-action → auth → return-to-context flow (Section 3) is the highest-risk point in the entire product for context loss, especially for Landlord/Service Provider registration, which is multi-step (OTP, email, document upload) and could plausibly span several minutes — the longer the interruption, the higher the risk of losing the original intended action's context if not engineered carefully.

**Places where users may not understand why they're blocked:**
- Every "pending" and "unsubscribed" state, if not given the explicit, state-specific messaging required by DESIGN_INTENT.md Principle 2, risks reading as a generic, unexplained block. This has been designed against throughout Section 2's journeys but remains the biggest execution risk once building begins.

**Opportunities to reduce steps without reducing trust or security:**
- None recommended here — introducing shortcuts (e.g., relaxing verification, auto-approving listings) would directly conflict with the platform's core trust proposition (DESIGN_INTENT.md §1) and is explicitly not this document's role to propose. No such changes are suggested.

---

## 6. Journey Dependencies (Critical Journeys)

| Critical Journey | Depends On |
|---|---|
| Attempting a Protected Action | Public browsing being fully open (no pre-auth wall) |
| Role-Aware Registration | Trigger action correctly identifying implied role |
| Completing Role-Appropriate Verification | Registration completing phone/email steps first |
| Returning to Original Context | Gated-action interception correctly capturing context (step 2 of Section 3) |
| Messaging a Landlord/Tenant/Customer | Authentication + (per Readiness Check) clarification of exact verification requirement for messaging |
| Creating a Property Listing | Landlord being authenticated; publishing further depends on Verified + Subscribed states |
| Subscription Requirement Before Publishing | Verified state already reached; payment method routing (PRD §7) functioning correctly |
| Submitting a Property for Admin Review | Listing creation complete + subscription active |
| Handling Listing States | Admin-side approval/rejection actions existing (defined in PRD §6.8, outside this document's scope) |
| Creating/Managing a Service Listing | Service Provider verification (Basic Trust Layer) complete |
| Managing the Approved Advertising Workflow | Advertiser authentication (phone OTP + email, PRODUCT_DECISIONS.md §5) |
| Switching Roles | Multi-role account support existing at the account/data level (approved, PRODUCT_DECISIONS.md §4) |

---

## Journey Readiness Check

Both previously open BLOCKER items have been resolved by approved product decisions and are reflected throughout this document:

- ~~Advertiser verification depth is undefined~~ — **RESOLVED.** Advertisers use the same lightweight phone OTP + email flow as Tenant/Buyer; account verification and ad content approval are explicitly distinct states (PRODUCT_DECISIONS.md §5).
- ~~Multi-role Basic Trust Layer reuse is undefined~~ — **RESOLVED.** Account-level email/phone verification is reused across all roles; adding a new role only requests that role's own additional requirements, and existing roles are never restricted while a new role is pending (PRODUCT_DECISIONS.md §8.1).

**BLOCKER** — must be resolved before information architecture:

None remain.

**IMPORTANT** — should be resolved before implementation:

1. **Exact verification requirement for messaging is not explicitly stated.** It's unclear whether a Landlord/Service Provider role in "pending admin document review" state (account-level authenticated but role not yet verified) can message/be messaged, or whether messaging requires full role-level "verified" status. The PRD states messaging is available once an account is "active" (§6.1) but doesn't clarify whether "active" means account-authenticated or role-verified.

2. **No defined timeframe for admin review** (documents, listings, service listings, ads) anywhere in the PRD. This is the single most repeated friction point across journeys (Section 5) and affects how "pending" states should be messaged to users.

3. **No defined resubmission mechanism for rejected items** (documents, listings, service listings, ads). The PRD confirms admin can reject but does not describe what happens next for the submitting user.

4. **Effect of a lapsed/inactive subscription on an already-live Landlord listing** is not defined in the PRD — does the listing come down automatically, get flagged, or remain live until manually addressed?

5. **Advertiser pricing sequencing** — PRD §9 states admin sets placement, duration, and cost, but doesn't clarify whether this happens before or after ad submission, i.e., whether the advertiser sees pricing upfront (self-serve) or only after admin review sets custom terms. This affects the Advertiser submission journey's step ordering.

6. **Whether editing a live listing re-triggers admin re-review** is not stated in the PRD.

**LATER** — can be resolved in a future iteration:

7. Whether a rejected document/listing/ad shows the specific rejection reason from admin, or a generic rejection notice — a UX quality question, not a blocking structural one.
8. Whether Saved Homes has any limit (count cap) — not indicated as a constraint anywhere, reasonable to assume none exists until stated otherwise, but not decided here.

---

**USER JOURNEYS READY FOR INFORMATION ARCHITECTURE.**
