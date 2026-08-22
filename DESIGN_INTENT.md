# NextHome — Design Intent

**Status:** Strategic foundation — precedes all screen design, wireframes, and component work.
**Sources used:** `NextHome_PRD_Phase1_Final.pdf`, `Next Home Brand Guidelines.pdf`, [PRODUCT_UNDERSTANDING.md](PRODUCT_UNDERSTANDING.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md).

**Note on source baseline:** This document was requested against a `REQUIREMENTS_BASELINE.md` file that could not be located on disk (checked working directory, Desktop, Downloads). Per direction, `PRODUCT_UNDERSTANDING.md` and `PRODUCT_DECISIONS.md` — together with the original PRD and Brand Guidelines — are treated as the current source of truth for this document. If `REQUIREMENTS_BASELINE.md` exists elsewhere or is created later, this document should be re-checked against it.

This document defines *why* the frontend should be built a certain way, before defining *what* it looks like. No screens, wireframes, or components are specified here.

---

## 1. Core Product Experience

**What the product should fundamentally help users achieve:**
Let a landlord or service provider get in front of a genuinely interested tenant/buyer/customer, and let a tenant/buyer/customer find a real, accurate listing or provider and reach them directly — with both sides confident the other is who they claim to be. This is the PRD's stated purpose: replacing WhatsApp groups, classifieds, and unreliable agents with "one trustworthy platform" (PRD §2).

**The main problem the interface should reduce:**
Uncertainty about legitimacy. The PRD frames the core failure of existing channels as a trust failure, not a discovery failure — people can already find listings on WhatsApp and classifieds; what they can't do is trust them. Every interface decision should therefore be evaluated on whether it reduces uncertainty about who they're dealing with, not just whether it looks good or is easy to click.

**The primary experience the frontend should create:**
A calm, evidence-based confidence: the user should feel like the system has already done some checking on their behalf (Basic Trust Layer, admin approval, Verified badges — PRD §6.1, §6.2, §8.1) before they invest time messaging or paying. The frontend's job is to *surface* that evidence, not manufacture a feeling of trust through decoration.

**What should feel effortless:**
- Getting from "I want a 2-bedroom in Lagos under a price" to a filtered result set (PRD §4, §6.3 — price/state/bedrooms filters, Short-Term/Long-Term tag).
- Sending a first message to a landlord about a specific listing.
- Landlord posting flow up to the point of payment (PRD §13 states target: <5 minutes to complete Trust Layer + post a listing).
- Switching between roles on a multi-role account (PRODUCT_DECISIONS.md §8) — this should feel like changing a setting, not logging into a different product.

**What should feel trustworthy:**
- Any element that represents another person (a landlord card, a service provider profile, a listing) — because that's the exact point where a user decides whether to invest time.
- The payment moment — because the PRD is explicit this is a real business processing real money from day one (PRD §2), not a demo.
- The messaging surface — because it's the system's stated dispute-resolution record (PRD §6.4).

**What should feel clear and immediately understandable:**
- What a listing actually costs, and for what (rent vs. sale price, PRD §4 scope note).
- Whether a listing/provider is verified vs. pending — this state must never be ambiguous.
- What a gated action requires before it can be completed (login only? login + verification? login + subscription?) — per PRODUCT_DECISIONS.md §6's account state model, these are three different requirements and the UI must never blur them into one generic "please log in."

---

## 2. Experience by User Type

### Public Visitor (not yet registered)

- **Primary goal:** Determine, without commitment, whether this platform has what they're looking for.
- **Likely mindset:** Evaluative, comparison-shopping, possibly skeptical (comparing against WhatsApp groups and classifieds they already distrust — PRD §2).
- **What information matters most:** That real, current, plausible listings exist here — price, location, bedrooms, a photo, and some visible trust signal (Verified badge, view count per PRD §4).
- **Most likely action:** Search/filter, then open a listing detail page.
- **Friction to reduce:** Any requirement to register before *seeing* value. Per PRODUCT_DECISIONS.md §2, browsing must remain fully open — the first authentication prompt a visitor sees should be tied to a specific action they just tried to take (message, save, list), never a blanket gate on content.

### Landlord

- **Primary goal:** Get a qualified tenant/buyer fast (PRD §3).
- **Likely mindset:** Transactional and slightly guarded about upfront cost — they're being asked to pay before they get any results (no free tier, PRD §6.5). They need to feel the subscription is worth it quickly.
- **What information matters most:** Listing status (pending/live/rejected), view count, and incoming messages — i.e., "is this working."
- **Most likely action:** Post a listing, then check for interest/messages.
- **Friction to reduce:** Ambiguity about *why* a listing isn't live yet (pending admin review vs. unpaid subscription vs. rejected — PRODUCT_DECISIONS.md §6 explicitly separates these states) and friction in the Trust Layer itself (OTP, email, document upload — PRD §6.1) which should feel like a short checklist, not a wall.

### Tenant / Buyer

- **Primary goal:** Find a real, accurate place to rent or buy (PRD §3).
- **Likely mindset:** Cautious but low-friction-seeking — this is the platform's free-tier user (PRD §6.6), so they have the lowest tolerance for being blocked or slowed down, and the lightest registration requirement of any role (PRODUCT_DECISIONS.md §5: phone OTP + email only, no document upload).
- **What information matters most:** Price, location, bedroom count, photos, and whether the landlord/listing is verified — the exact fields the PRD prioritizes on the listing card (PRD §4).
- **Most likely action:** Search, open a listing, message the landlord, or save it for later (Saved Homes — PRODUCT_DECISIONS.md §4.1).
- **Friction to reduce:** Any suggestion that messaging or saving requires the same heavyweight verification a Landlord goes through — it explicitly does not, and the interface should not accidentally imply otherwise (e.g., by showing document-upload UI in a tenant's registration modal).

### Service Provider

- **Primary goal:** Get discovered by nearby customers needing a trade service (PRD §3).
- **Likely mindset:** Similar to Landlord — willing to go through verification because it's free to list (PRD §6.7) and the payoff is visibility, not payment friction.
- **What information matters most:** Their own listing status and incoming customer messages.
- **Most likely action:** Complete Trust Layer, create a service listing, respond to messages.
- **Friction to reduce:** Category selection should feel current and relevant, not like a static, outdated dropdown — the PRD states categories are admin-managed and can grow over time (PRD §6.7).

### Advertiser

- **Primary goal:** Get an ad placed in front of the platform's visitors (PRD §9).
- **Likely mindset:** Self-serve and outcome-focused — they want to know where their ad will run, for how long, and what it costs, without needing to talk to anyone (PRD §9: "self-serve submission form").
- **What information matters most:** Ad review/approval status and (once live) basic confirmation it's running — payment and placement details (PRODUCT_DECISIONS.md §7, Advertiser dashboard scope).
- **Most likely action:** Submit ad creative for review.
- **Friction to reduce:** Uncertainty about approval status — since all ad content is admin-reviewed before going live (PRD §9), the interface must make "pending vs. approved vs. rejected" immediately legible, the same way it must for listings.

---

## 3. Emotional and Brand Experience

The brand guideline gives one explicit personality statement: **"modern, approachable and trustworthy"** (Brand Guidelines, p.9). Below is what each of those means operationally — not as adjectives to repeat, but as concrete interface behavior.

**Trustworthy →**
- **Hierarchy:** Verification state (Verified badge, pending state, subscription state) is never buried below decorative content. If a user has to scroll or hunt to find out whether a listing is verified, hierarchy has failed at the platform's core promise.
- **Spacing:** Generous, uncluttered spacing around anything representing a real person or transaction (a landlord's contact card, a payment step) — cramped spacing around identity/money information reads as evasive, not efficient.
- **Typography:** Consistent, predictable type usage (Quicksand Bold for headings, Quicksand Medium for body per Brand Guidelines p.9) with no ad hoc weight/size mixing — inconsistency in typography is one of the fastest ways a marketplace starts to feel unmaintained, which directly undermines trust.
- **Color usage:** The primary blue palette (Deep Blue `#1B537B`, Blue `#0492C2`, Light Blue `#5DCFFC`) is reserved for structural/brand elements and primary actions; it is never used for a status that could be confused with a system state (success/warning/error need their own distinct treatment, separate from brand blue, so a "pending" listing is never visually indistinguishable from a "verified" one).
- **Feedback:** Every state-changing action (submit for review, send message, save a home) gets an explicit, specific confirmation — not a generic toast. "Your listing was submitted and is pending review" is trustworthy; a bare checkmark is not.
- **Interaction:** No dark patterns — no disguised upsells, no forced continuity language, no ambiguous cancel buttons on the subscription flow. Given the PRD's own transparency stance on cost (the tech stack document itemizes every charge, including a stated principle that "no cost outside this document should be introduced later without a separate, explicit change request"), the interface should mirror that same transparency at the payment UI.

**Approachable →**
- The rounded Quicksand typeface and house/cloud logo motif suggest warmth rather than corporate severity — the interface should favor plain, direct microcopy ("List your property," "Message this landlord") over formal or technical phrasing, and favor rounded corners/soft edges in UI chrome consistent with the rounded letterforms and logo shape, rather than sharp, dense, enterprise-dashboard styling.
- Forms (especially the Basic Trust Layer, which is the most friction-heavy flow in the product) should be presented as a short, human checklist with plain explanations of *why* each step exists, not a compliance form.

**Modern →**
- Interpreted here specifically as: no visual debt from the "old" channels this product replaces. Nothing about the interface should resemble a classifieds board, a forum thread, or a WhatsApp-style chat bubble aesthetic bolted onto a website — the in-app messaging (PRD §6.4) should read as a first-class platform feature, not an afterthought chat widget.

---

## 4. Information Priority Principles

**Always immediately visible (public browsing):**
- Photo, price, location, bedroom count, and verification status on every listing card (PRD §4).
- Rent vs. Sale mode, and within Rent, Short-Term/Long-Term — these are the primary mental filters a visitor arrives with.
- View count, where present — it's a lightweight trust/popularity signal the PRD explicitly calls out (PRD §4, §6.2).

**Secondary (available on the detail page, not the card):**
- Full description, additional photos, landlord's review/rating history, exact posting date.
- Service Provider category detail and contact-request flow.

**Appear only when needed (contextual/gated):**
- Registration/login prompts — only at the point of a gated action (PRODUCT_DECISIONS.md §9), never pre-emptively.
- Document upload / Basic Trust Layer UI — only for Landlord and Service Provider roles, only during their registration or when explicitly revisiting verification status (never shown to a Tenant/Buyer, per PRODUCT_DECISIONS.md §5).
- Subscription/billing prompts — only when a Landlord attempts to publish, not on every dashboard visit once already subscribed.

**How the interface should reduce cognitive load:**
- One primary decision per screen: search screens optimize for filtering, detail pages optimize for the message/save decision, dashboards optimize for "what needs my attention" (pending items, unread messages) rather than presenting everything with equal weight.
- Status is always shown as a single, unambiguous label per item (e.g., a listing is exactly one of: pending review / live / rejected — never implied through multiple weakly-related signals a user has to interpret themselves).

**Public browsing vs. authenticated dashboard experiences:**
- Public browsing is **discovery-oriented**: broad, scannable, low-commitment, optimized for comparing many listings quickly.
- Authenticated dashboards are **status-oriented**: narrow, specific, action-oriented, optimized for "what is the state of my stuff and what do I need to do next" (per role, per PRODUCT_DECISIONS.md §7 dashboard scopes). The visual language can share brand DNA (color, type) but the *density and framing* should differ — dashboards may reasonably show more information per screen than public browsing, because the user is now managing their own things, not evaluating unfamiliar ones.

---

## 5. Primary Action Principles

- **Browsing:** No primary action required — browsing itself is the default, frictionless state. Nothing should interrupt scrolling/filtering with a login prompt.
- **Searching:** Filters should apply live/immediately (PRD §4 references results "updating instantly" as a housing.com pattern worth borrowing) — search is a primary, always-available action, not a separate step requiring submission.
- **Viewing property details:** The listing detail page's job is to build enough confidence to justify the next action (message or save) — it is a supporting screen, not a terminal one.
- **Contacting users (messaging):** This is the single most important conversion action in the tenant/buyer journey and must be the visually dominant call-to-action on any listing detail page — more prominent than secondary actions like sharing or reporting.
- **Listing a property:** The Landlord's primary action, and it should be persistently accessible (PRD §4: "a prominent 'Post Property' call-to-action for landlords, always visible") — but the flow itself should clearly separate the *free* steps (Trust Layer, filling in listing details) from the *paid* step (subscribing), so the user is never surprised by a payment wall they didn't see coming.
- **Managing role-specific tasks (dashboards):** Primary action per dashboard should map to the role's core loop — Landlord: "Post a Property" / respond to messages; Tenant: browse/search entry point + review saved homes; Service Provider: respond to messages; Advertiser: submit a new ad. Everything else in the dashboard is secondary to that one loop.

**Distinguishing primary, secondary, and destructive actions:**
- **Primary actions** (Post a Property, Send Message, Save Home, Subscribe/Pay) use the brand's Blue (`#0492C2`) as the dominant, filled treatment — one clear primary action per screen/section, never two competing filled buttons side by side.
- **Secondary actions** (Cancel, Edit, View Details, Back) use an outlined or text-only treatment in Deep Blue or neutral tones — visually present but clearly subordinate.
- **Destructive or irreversible actions** (unpublish a listing, remove a review, delete an account, unsave — where consequence matters) must be visually distinct from both primary and secondary actions — never share the primary brand blue, and always require a confirmation step when the action cannot be trivially undone. (Note: the exact destructive-action color is a system-level decision to make during component design, not brand blue — the brand guideline does not define a warning/danger color, which should be flagged when component work begins.)

---

## 6. Design Principles

1. **Every listing and profile must show its trust state before anything else about it.** Price and photos are secondary to knowing whether a listing/provider is Verified, pending, or unverified. If a screen shows attractive content before trust state, it's decorating over the platform's actual value proposition. *Avoid:* burying a Verified badge in fine print or a tooltip.

2. **Never let a gated action fail silently or ambiguously.** Per the account state model (PRODUCT_DECISIONS.md §6), a blocked action is always blocked for exactly one of: not logged in, pending verification, or unsubscribed. The interface must name which one, every time. *Avoid:* a generic disabled button or "you can't do that" message with no reason given.

3. **Registration friction must match the role, never exceed it.** A Tenant/Buyer must never encounter Landlord/Service-Provider-level verification (document upload, mother's maiden name) — this was an explicit, deliberate product decision (PRODUCT_DECISIONS.md §5), not an oversight to "fix" later for consistency. *Avoid:* reusing one generic registration component across all roles without conditional logic for verification depth.

4. **Payment moments are transparency moments, not conversion-optimization moments.** Given the platform's own cost-transparency stance (tech stack doc: no hidden costs, explicit approval-required change process), subscription and ad-payment screens must state exactly what's being charged, when, and why — before asking for payment details. *Avoid:* obscuring the no-free-tier requirement until the user has already invested effort building a listing.

5. **Messaging is core infrastructure, not a bolt-on chat widget.** Because in-app messaging is the platform's designated dispute-resolution record (PRD §6.4) and its primary conversion action for tenants, it must be designed with the same weight as search and listings — persistent, easy to find, and never presented as a minor utility feature. *Avoid:* hiding messaging behind multiple clicks or treating it as a lower-priority tab.

6. **Public and authenticated experiences share brand identity but not layout density.** Discovery screens (public) stay broad and scannable; management screens (dashboards) can be denser and status-driven, because the user's intent has shifted from evaluating to managing (see §4). *Avoid:* forcing dashboard screens to mimic the sparse, marketing-style layout of public pages, which would bury actionable status information.

7. **One primary action per screen, always.** Every screen (search results, listing detail, dashboard panel) must have exactly one visually dominant action; everything else is secondary. This applies the "trust through clarity" principle at the interaction level — competing primary actions create the same ambiguity problem as ambiguous trust states. *Avoid:* multiple equally-weighted call-to-action buttons in the same view.

---

## 7. Interaction Principles

**Authentication prompts:**
- Triggered only by a specific gated action, never proactively or on page load.
- Presented in-context (modal/inline), preserving the user's place in the browsing flow (PRODUCT_DECISIONS.md §9).
- Copy names the action that triggered the prompt ("Log in to message this landlord"), not a generic "Please sign in."

**Gated actions:**
- Visually available (not hidden) to unauthenticated users where the action itself is discoverable content (e.g., a "Message" button is visible on a public listing page) — the gate happens at the moment of attempted use, not by hiding the feature's existence. This matches the product's public-browse philosophy: discovery should never feel artificially restricted.

**Role switching:**
- A deliberate, explicit action initiated from the account/profile area (PRODUCT_DECISIONS.md §8) — never automatic or inferred from context.
- Switching roles must clearly confirm which role is now active (persistent indicator), since dashboard content and navigation change entirely based on it.
- Does not require re-authentication, but should feel like a distinct, acknowledged context change — not a silent swap.

**Verification states:**
- Always rendered as one of a small, fixed set of explicit states (e.g., Unverified / Pending Review / Verified) — never inferred from the presence/absence of other UI elements.
- Pending states include a plain explanation of what's being waited on (e.g., "Your documents are under review by our team") rather than a bare "pending" label.

**Subscription states:**
- Distinct from verification states in the UI — a verified-but-unsubscribed Landlord should see a clear, specific call to subscribe, not a reused "complete your account" message that conflates the two gates (PRODUCT_DECISIONS.md §6).

**Success feedback:**
- Specific to the action taken ("Your listing has been submitted for review," not "Success!") — confirms both what happened and, where relevant, what happens next.

**Errors:**
- Plain-language, specific to the failure (e.g., a failed payment names the reason if the provider supplies one), never a raw technical/system error surfaced to the user.
- Errors on gated actions (e.g., attempting to message while pending review) explain the blocking condition, consistent with Design Principle 2.

**Loading:**
- Any action with a network dependency (search filtering, listing submission, payment) shows an explicit loading state — never a silently unresponsive UI, which would undermine the "trustworthy" brand goal by feeling broken.

**Pending states:**
- Treated as first-class, persistent UI states (not transient toasts) for anything awaiting admin action — listings, service provider profiles, ads, document review — since these can remain pending for a real, possibly extended period and the user needs to be able to check back and understand where things stand at any time.

---

## 8. Motion Principles

Motion (via the Motion library) is planned for future implementation. No motion library is installed, and no motion should be designed into specific components yet — these are the governing principles for when that work begins.

**When motion should be used:**
- To communicate a state change that matters (a listing moving from pending to verified, a message arriving, a saved-home toggle confirming).
- To preserve spatial continuity when context changes (e.g., a modal opening from the element that triggered it, so the user doesn't lose their place — directly supporting the authentication-prompt interaction principle in §7).
- To draw attention to a single, specific piece of new information (a new message badge, a status change) — never to multiple things at once.

**When motion should NOT be used:**
- Purely decorative entrance animations on page load (cards fading/sliding in on scroll for their own sake).
- On core content that a user needs to scan quickly (search results, listing grids) — motion here competes directly with the scanability the browsing experience depends on (§4, §5).
- As a substitute for a clear state label — motion can *reinforce* a state change, but the state must always also be legible statically (a screenshot of any screen should be fully understandable with zero ambiguity, motion or not).

**The purpose motion should serve:**
Motion's entire job on this product is to reduce confusion about *what just changed and why* — never to add visual interest for its own sake. Given Design Principle 4 (payment moments are transparency, not conversion-optimization), motion must never be used to create urgency, artificial scarcity cues, or manipulate attention toward a paid action.

**Accessibility and reduced-motion requirements:**
- All motion must respect the user's OS-level `prefers-reduced-motion` setting — when set, transitions reduce to instant or near-instant state changes with no easing/movement, never removed information.
- No motion should be the sole carrier of meaning (color/icon/text must always convey the same information motion reinforces) — this directly supports the "static screenshot must be understandable" rule above.
- No motion should exceed a duration that could trigger discomfort for motion-sensitive users (large, fast, full-screen movement should be avoided regardless of the reduced-motion setting).

**Principles for transitions, overlays, and feedback:**
- **Transitions** between related views (e.g., listing card → listing detail) should feel continuous, not like a hard context switch, when feasible — reinforcing that the user hasn't left their search results, just gone deeper into them.
- **Overlays** (authentication modals, confirmation dialogs) should animate in a way that visually anchors to their trigger point, not appear centered/detached from user action.
- **State changes** (pending → verified, unsubscribed → active) deserve a distinct, one-time acknowledgment (not a persistent animation) — motion marks the moment of change, then settles into a static state.
- **Feedback** (success, error, saved) should be quick and unobtrusive — motion here should never delay the user's ability to continue their task.

---

## 9. Anti-Patterns to Avoid

**Property browsing:**
- Infinite, undifferentiated scroll with no clear sense of result count or filtering state — visitors should always know how many results match and what filters are active.
- Listing cards that omit verification status to save space — this directly undermines the core trust proposition (Design Principle 1) and must never be treated as an optional/decorative element.
- Photo-only cards with price/location as an afterthought overlay — the PRD's explicit card model (photo, price, location, bedroom count, action button — PRD §4) should not be reduced to a purely visual gallery.

**Dashboards:**
- A single undifferentiated activity feed that mixes all roles' data together for multi-role accounts — dashboard content must always be scoped to the single active role (PRODUCT_DECISIONS.md §8), never blended.
- Vague status labels ("In Progress," "Processing") where a specific state exists (pending review, unsubscribed, rejected) — always use the specific state.
- Dashboards that hide the user's most important pending item (unread message, rejected listing, pending payment) below promotional or low-priority content.

**Role-based experiences:**
- Reusing one generic account/settings screen across all roles without adapting it to what's actually relevant (e.g., showing document-upload status to a Tenant/Buyer who never went through that flow).
- Making role switching feel like logging into a different app (different visual language, disorienting navigation reset) rather than a controlled context change within one identity.

**Cards:**
- Overloading a listing/provider card with secondary information (full descriptions, multiple badges, unrelated promotional content) that competes with the primary scan fields (price, location, bedrooms, trust status).
- Inconsistent card treatment between property listings, service provider listings, and ads — each should be visually distinguishable as a different content type, especially ads, which must never be styled to be mistaken for an organic listing (a real trust risk given the PRD's ad-placement model, §9).

**CTAs:**
- More than one filled/primary-style button in the same view (violates Design Principle 7).
- CTA copy that's vague about consequence, especially around payment ("Continue," "Next" on a step that actually charges a card) — copy must be specific ("Subscribe — $X/month").
- Destructive actions styled identically to primary actions (§5) — e.g., a "Delete Listing" button that looks like "Post a Property."

**Animations:**
- Animating content the user needs to read or compare quickly (search results, price figures) — motion should never slow down scanning.
- Using motion to mask a slow loading state instead of showing honest loading feedback (§7) — motion is not a substitute for performance or for the explicit "loading" state principle.
- Attention-grabbing motion on a payment or subscription CTA — conflicts directly with the "no urgency manipulation" rule in §8.

**Information density:**
- Public pages that try to show dashboard-level detail (over-explaining verification internals, admin-review mechanics) to a visitor who just wants to evaluate a listing.
- Dashboards that under-show information in the name of minimalism, forcing the user to click through multiple screens to find basic status (contradicts §4's dashboard density guidance).

---

## 10. Design Decision Test

Before approving any future screen, component, or interaction, it should pass every applicable question below. A "no" or "unclear" answer means the decision needs revision, not that it should be waved through.

- [ ] **Product purpose:** Does this help a user get in front of a legitimate match (tenant↔landlord, customer↔provider, advertiser↔visitor) faster or with more confidence — or is it unrelated decoration?
- [ ] **User goal:** Does this serve the primary goal of the specific role viewing it (§2), without introducing steps or information relevant only to a different role?
- [ ] **Brand:** Does this reflect trustworthy/approachable/modern as defined operationally in §3 — not just visually resembling the brand, but behaving the way §3 specifies (hierarchy, feedback, transparency)?
- [ ] **Information hierarchy:** Is trust/verification status, price, and the single primary action for this screen immediately visible without scrolling or hunting (§4, §5)?
- [ ] **Trust:** If this involves another person, money, or a status the user is waiting on, is the current state named explicitly and unambiguously, with no silent failure states (§6 Principle 2, §7)?
- [ ] **Accessibility:** Does this remain fully understandable with motion reduced/disabled, and does no critical information depend on color or animation alone (§8)?
- [ ] **Approved requirements:** Does this stay within what's defined in the PRD and PRODUCT_DECISIONS.md — and if it introduces something new (a new field, a new state, a new role behavior), has that been explicitly flagged for approval rather than assumed?

---

## Scope Reminder

This document defines strategic design intent only. No screens, wireframes, UI components, layouts, or code have been proposed or created as part of this work. The next phase (screen/wireframe design) should be evaluated against every section above, particularly §10, before proceeding.
