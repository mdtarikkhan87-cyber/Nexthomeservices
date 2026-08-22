# NextHome — Product Understanding

Source documents:
- `NextHome_PRD_Phase1_Final.pdf` (Product Requirements Document, Phase 1)
- `Next Home Brand Guidelines.pdf`
- `NextHome_Final_TechStack.pdf` (Final Approved Technology Cost Sheet, v1.0, August 2026)

This document synthesizes only what is stated or directly implied in the three source documents. Anything not explicitly supported is marked **[ASSUMPTION]** or **[MISSING / NOT SPECIFIED]**.

---

## 1. What Problem the Product Solves

NextHome replaces the informal, unreliable channels currently used for property rental and sale in the target market — **"WhatsApp groups, classifieds, and unreliable agents"** (PRD §2) — with a single trustworthy online platform where:

- Landlords can list properties (for rent, and now also for sale) and find tenants/buyers.
- Tenants/buyers can search and apply for properties online instead of relying on word-of-mouth or informal listings.

The core problem is **trust and fragmentation** in the property search/rental process: no unified place to see legitimate listings, no verification of who is posting, and no accountable channel for communication. NextHome's admin-approval workflow, "Verified" badges, and in-app messaging are explicitly designed to address this trust gap (PRD §3, §4, §6.1–6.4).

A secondary problem addressed: local trade service providers (electricians, plumbers, mechanics) lack a discovery channel to reach nearby customers (PRD §3, §6.7).

The PRD also states the business model explicitly: it is **not a demo** — it is designed to accept real payments and generate subscription revenue from landlords from day one (PRD §2).

---

## 2. Primary and Secondary Users

Per the PRD's user table (§3), the platform has five defined user/account types:

**Primary users:**
- **Landlord** — lists properties for rent or sale; pays a subscription; the core revenue-generating user.
- **Tenant / Buyer** — searches, views, messages landlords, and leaves ratings; uses the platform free of charge in Phase 1.

**Secondary users:**
- **Service Provider** — electricians, plumbers, mechanics, and similar trades; lists services, free to join in Phase 1.
- **Advertiser** — individuals or companies who submit ads for admin-reviewed placement; a secondary revenue stream.
- **Admin (the client/platform owner, "You")** — operates and moderates the entire platform: approvals, pricing, disputes, categories, ads, revenue visibility.

The PRD frames all of these as accounts on **one single website** (§5) — there is no separate landlord/tenant/admin site, only role-based views and a modularized backend.

---

## 3. Primary User Goals

From the PRD's "What they want" column (§3) and workflow sections (§6):

| User | Primary goal |
|---|---|
| Landlord | List a property for rent or sale, and find a tenant or buyer fast |
| Tenant/Buyer | Find a real, accurate place to rent or buy |
| Service Provider | Offer a trade service to people nearby |
| Advertiser | Promote a business, property, or service to visitors |
| Admin | Keep the platform trustworthy |

Supporting goals stated in the PRD:
- Landlords want visibility into interest in their listing (view counts, PRD §4, §6.2).
- Tenants/buyers want confidence that listings are accurate and landlords are legitimate (driving the Verified badge and ratings system, PRD §4, §8.1).
- The Admin's success criteria are explicit and largely operational (PRD §13): fast onboarding (<5 minutes to post a listing), frictionless messaging, working payments across currencies/methods, self-serve pricing control, and a codebase a new developer can pick up without calling the original team.

---

## 4. User Motivations and Frustrations

The PRD does not present formal user research, personas, or quotes — motivations/frustrations are inferred from the stated problem framing and the design decisions it drives. These should be treated as document-derived interpretation, not independently verified research:

- **Frustration with existing channels**: The PRD explicitly names WhatsApp groups, classifieds, and "unreliable agents" as the incumbent, unsatisfactory ways this is currently done (§2). This implies frustration with scattered, unverifiable, and low-trust listings.
- **Fear of scams / bad actors**: The entire Basic Trust Layer (phone OTP, email, mother's maiden name, document upload, admin review), Verified badges, and the Complaints ticketing system (§6.1, §8.3) are direct responses to a stated need to filter out "bad-actor landlord[s]," "suspicious listing[s]," or "scam attempt[s]."
- **Desire to keep communication accountable**: The in-app messaging design, with its on-screen reminder to stay on-platform, reflects a motivation to protect users from off-platform deals gone wrong — while the PRD is explicit that this cannot be technically enforced, only nudged (§6.4).
- **Landlord interest in performance visibility**: The view-count feature on listings (§4, §6.2) implies landlords are motivated by knowing whether their listing is getting attention.

**[MISSING / NOT SPECIFIED]**: No user interviews, survey data, market sizing, or named user pain-point research appear anywhere in the PRD. Anything beyond the bullet points above would be speculation.

---

## 5. Most Important Actions Users Need to Perform

Per the PRD's "How We'll Know It's Working" acceptance criteria (§13) and workflow sections (§6), the critical user actions are:

**Landlord:**
1. Complete the Basic Trust Layer (phone OTP, email, mother's maiden name, document upload).
2. Subscribe (payment) — required before any listing can go live (no free tier).
3. Post a Rent or Sale listing (address, price, bedrooms, description, photos; Short-Term/Long-Term tag if Rent).
4. View/respond to tenant messages via dashboard.
5. Manage/adjust nothing pricing-related themselves (that's Admin) — but they view their listing's performance (view count) and interest.

**Tenant/Buyer:**
1. Search/filter listings (Rent or Sale mode; price, state dropdown, bedrooms; Short-Term/Long-Term within Rent).
2. View a listing's full detail page.
3. Message a landlord via in-app messaging.
4. Leave a rating/review after an interaction.
5. Submit feedback or a complaint if needed.

**Service Provider:**
1. Complete the Basic Trust Layer.
2. Create a service listing (type, description, contact, photos).
3. Receive/respond to customer messages via the same in-app messaging system.

**Advertiser:**
1. Submit an ad (image, text, link) via a self-serve form for admin review.

**Admin:**
1. Approve/reject listings, service providers, and ads.
2. Set/adjust subscription and ad pricing, including promotions.
3. Confirm bank-transfer payments requiring manual matching.
4. Manage ratings, complaints (ticket status: open/in review/resolved), and feedback.
5. Manage service categories.
6. View all users, listings, and payments/revenue in one dashboard.

---

## 6. The Emotional Experience the Product Should Create

The PRD does not use explicit emotional-design language (no persona quotes, no "should feel like X" statements), so this section is inferred from stated design intent and framed as interpretation:

- **Trust and safety**: The repeated emphasis on "Verified" badges, admin approval before anything goes live, ratings/reviews, and a formal complaints ticketing system all point to an intended feeling of *"this platform has vetted what I'm looking at, and there's someone accountable if something goes wrong."*
- **Confidence/simplicity in transactions**: The payments section stresses that from the user's point of view "there is no visible difference in experience" regardless of country or payment method (§7) — implying an intended feeling of seamlessness rather than friction or confusion around paying.
- **Being in control (Admin)**: For the Admin specifically, the repeated phrase "without a developer" / "without any developer involvement" (§6.5, §6.8, §9, §13) signals an intended feeling of autonomy and control over pricing, moderation, and categories.
- **Reassurance from transparency**: In-app messaging keeps a "clear record" for both sides and the admin (§6.4), which suggests an intended feeling of fairness/protection in disputes.

**[ASSUMPTION]**: Beyond what's above, no explicit tone-of-voice, emotional journey map, or UX writing guidance is present in any of the three documents. Statements about "delight," "warmth," "excitement," etc. are not supported by the source material and are intentionally omitted here.

---

## 7. Brand Personality

Directly stated in the Brand Guidelines (p.9, Typeface section):

> "The Next Home typography has been selected to create a **modern, approachable and trustworthy** brand identity."

This is the only explicit personality statement in the brand document. It aligns with the PRD's functional emphasis on trust (verification, approval workflows, badges, complaints handling).

Supporting visual/tonal cues from the Brand Guidelines that reinforce this personality:
- A rounded, friendly sans-serif typeface (Quicksand, in Bold and Medium weights) — rounded letterforms typically read as approachable/friendly rather than corporate or severe.
- A house-shaped logo with a cloud motif and forward-pointing chevrons (`>>>`), suggesting home, aspiration, and forward movement.
- A blue-dominant palette (Deep Blue, Blue, Light Blue as primary colors) — blue is conventionally associated with trust and stability in brand design, consistent with the "trustworthy" descriptor, though the document itself does not state this association explicitly.

**[ASSUMPTION]**: The brand guidelines do not include a mission statement, brand values list, tone-of-voice guide, messaging pillars, or target-audience description beyond the one typography sentence quoted above. Any broader personality description (e.g., "friendly but professional," "premium," "youthful") would be extrapolation beyond the document and is not included here as fact.

---

## 8. Visual Implications of the Brand

Directly specified in the Brand Guidelines:

**Logo**
- Primary logo: stacked "NEXT / HOME" wordmark inside/below a house-and-cloud icon, with three chevrons (`>>>`) beneath.
- Secondary logo: horizontal "NEXT HOME" wordmark, used when the primary logo doesn't fit space/layout constraints (p.3).
- Minimum clear space: primary logo requires clear space ≈ height of the 2-line wordmark (~78.16px / 435.26px reference values given); secondary logo requires clear space ≈ height of the 1-line wordmark (~58.62px / 433.39px reference values given) (p.4).
- Logo must never be: stretched/squashed, rotated, recolored outside approved variants, given shadows/outlines/effects, placed on low-contrast backgrounds, rearranged, cropped, or have extra graphics/text added (p.10).

**Color**
Primary palette (p.7):
- Deep Blue — `#1B537B`
- Blue — `#0492C2`
- Light Blue — `#5DCFFC`

Secondary palette (p.8), used sparingly for highlights/backgrounds/supporting elements:
- Dark Blue — `#172A3A`
- Off-white — `#F0F7F7`
- Black — `#000000`
- White — `#FFFFFF`

Logo color-use rules (p.5–6):
- Full color on light backgrounds; on colored/dark backgrounds, replace Blue with Off-white for contrast.
- Single-color variants: Light Blue on dark backgrounds, Blue on light/white backgrounds, Off-white on colored backgrounds, Black where color reproduction is unavailable.
- No color variants beyond those explicitly shown should be created.

**Typography** (p.9)
- Primary typeface: **Quicksand Bold** — for headings, key messaging, prominent titles.
- Secondary typeface: **Quicksand Medium** — for body copy, captions, and supporting information.
- Only one type family (Quicksand) is specified across both weights; no secondary/pairing font is defined.

**Implications for any future visual/UI work** (derived directly from the above, not from assumption):
- UI should stay within the defined blue-dominant palette; off-white/white are the backgrounds, black is a fallback only, not a primary UI color.
- All headings should use Quicksand Bold; body text Quicksand Medium — consistent with the "modern, approachable, trustworthy" personality.
- Any "Verified" badge, trust indicator, or CTA button treatment should stay within the primary/secondary color set and avoid introducing new brand colors (e.g., no unapproved reds/oranges — notably, the guideline's "Don'ts" page shows an orange/red misuse of the logo as an explicit example of what **not** to do).

**[MISSING / NOT SPECIFIED]**: No iconography system, spacing/grid system, imagery/photography style, button/component styling, or UI pattern library is defined in the brand guidelines. These would need to be defined separately before UI design work begins. (Per the task instructions, no frontend code or UI design is being produced at this stage regardless.)

---

## 9. Functional Constraints from the PRD

Explicit scope boundaries and rules stated in the PRD:

**Included in Phase 1** (§11.1):
- Landlord, tenant/buyer, and service provider accounts with Basic Trust Layer verification (phone OTP, email, mother's maiden name, admin-reviewed document upload).
- Rent and Sale listings, photos, search/filters (state dropdown, price, bedrooms, Short-Term/Long-Term within Rent), per-listing view counts.
- In-app messaging (tenant/buyer ↔ landlord, and for service providers).
- Landlord subscriptions via Stripe, Paystack, and bank transfer — **no free listing tier**, **one subscription per user (non-transferable)**, admin-adjustable pricing including promotions.
- Tenant subscription capability, built but **disabled by default**.
- Service provider listings — free to join, admin-managed categories.
- Advertisement section — admin-controlled placement, duration, pricing.
- Ratings & reviews, feedback form, complaints ticketing, Help/FAQ section.
- Admin dashboard: approvals, user/listing/payment visibility, pricing controls, bank-transfer confirmation.
- Fully responsive (phone, tablet, desktop).

**Explicitly out of scope for this engagement** (§11.2):
- Virtual tours, digital contracts/e-signing, tenant screening, AI rent estimation, native mobile apps, a property management suite, mortgage/financing tools.
- The PRD states plainly these will **not be built by this team as part of this or any follow-on engagement** — described as requiring "specialized experience outside what we do."
- Mortgage calculators, financing tools, and agent/builder project pages are also explicitly excluded even within the Sale feature (§4 scope note).
- Short-Term/Long-Term is a **filter tag only** — not a separate booking system, nightly-pricing model, or availability calendar (§14, Assumptions). A booking calendar would be a separately scoped addition.
- NIN (government ID) verification is **not included** in Phase 1; the Basic Trust Layer is designed so NIN could be layered on later without a rebuild (§6.1).

**Hard business-rule constraints:**
- No free listing tier for landlords — subscription required before the first listing goes live (§6.5, §11.1).
- One subscription per landlord account; not shareable/transferable (§6.5).
- Listings (rent, sale, and service) must pass admin approval before becoming visible/searchable (§6.2, §6.7).
- Tenants/buyers use the platform entirely free in Phase 1; tenant monetization is a toggle for later, not built to be active now (§6.6).
- Service providers are free to list in Phase 1, with the same later-monetization toggle pattern as tenants (§6.7, §14).
- Single primary language: English only for Phase 1 (§14).
- Communication safety is handled by **soft nudges only** (on-screen reminders, message screening that flags — not blocks — phone numbers/emails); the PRD explicitly states off-platform communication **cannot be technically prevented**, and liability is intended to be handled via Terms & Conditions, not software (§6.4, §14).
- Advertisement creative (images/copy) is supplied by each advertiser — ad design is not part of this team's deliverable (§14).

**Deliverable/handover constraints** (§10):
- Full source code in clearly labeled modules (Listings, Services, Messaging, Advertisements, Payments, Users, Admin, Ratings/Support).
- Written setup guide, plain-English code comments where logic isn't obvious, auto-generated API documentation, database change history, one-click deployment already configured.
- Explicit goal: a new developer, using only handover docs, can run the project without contacting the original team (§13).

**Assumptions the PRD itself flags** (§14) — these are the PRD authors' own listed assumptions, not mine, but are included here since they function as constraints on scope:
- Client provides branding basics or approves a default design.
- Client sets up Stripe/Paystack merchant accounts and bank details early.
- Client sets up (or gets a recommendation for) an SMS provider account for phone OTP.
- Sale listings use one-time price but otherwise follow the same rules as rent listings unless told otherwise.
- Client's Terms & Conditions (a legal document, reviewed by client's lawyer) will state that off-platform communication/agreements are at the user's own risk.

---

## 10. Technical Constraints from the Tech Stack Document

Note: The tech stack document (`NextHome_Final_TechStack.pdf`) is framed as a **cost/billing reference**, not a full architecture spec — it names the technologies used and their cost status, but does not describe system architecture, data models, or integration details in depth. Constraints below are what can be directly drawn from it.

**Confirmed technology stack** (§2.1, all marked INCLUDED, free/open-source):
- **Frontend**: Next.js (React)
- **Styling**: Tailwind CSS
- **Backend runtime**: Node.js
- **Backend framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js

**Hosting/infrastructure** (§2.2, §3):
- **Frontend hosting**: Vercel
- **Backend + database hosting**: Railway
- **Photo/file storage**: Amazon S3
- **Caching + background jobs**: Redis (explicitly required for listing alerts and rate-limiting)
- **SSL**: Let's Encrypt (auto-provisioned, always free)
- **CI/CD**: GitHub Actions (auto-deploy)
- **Error monitoring**: Sentry

**Payments integration** (§2.3, §3.3, ties directly to PRD §7):
- Stripe (sandbox in dev, live in production) — standard fee 2.9% + $0.30; international cards ≈4.4% + $0.30.
- Stripe Billing is **OPTIONAL** (adds 0.7%) — only if subscription billing (as opposed to one-off charges) is used; this is not automatically included.
- Paystack (sandbox in dev, live in production) — 1.5% + ₦100 (capped ₦2,000, waived under ₦2,500) for local Nigerian cards; 3.9% + ₦100 for international cards routed through Paystack.
- Country-based routing between Stripe and Paystack is a designed system behavior (PRD §7), not an ad hoc integration.

**Cost-based constraints relevant to scope decisions:**
- Development phase runs entirely on free tiers/open-source — **Rs. 0** total (§2).
- Launch triggers one-time costs: domain (Rs. 1,000/yr), Railway credit (Rs. 10,000), S3 credit (Rs. 3,000) — Rs. 14,000 (~$168) one-time, covering ~1 year.
- Ongoing monthly cost at launch-stage traffic: **Redis is the only paid line item**, Rs. 425–850/month (~$5–10/mo); everything else (Vercel, Sentry, GitHub Actions, SSL, backups) remains free at that traffic level.
- Any feature requiring a tool not listed in this document (explicitly named examples: **a mobile app, SMS verification, live chat**) is **not covered by this cost approval** and must be quoted/scoped separately (§1). This is a direct, explicit constraint: SMS provider costs for phone OTP are NOT included in this cost sheet, even though phone OTP is a required Phase 1 feature per the PRD — the PRD (§14) separately states the client is responsible for setting up an SMS provider account.
- Future scaling costs (Railway, S3, Vercel, Sentry, GitHub Actions, Redis, optional Cloudflare CDN) are usage-based and explicitly **not part of the approved Phase 1 charges** — they apply automatically only once real traffic crosses free/launch-tier limits (§4).

**Implicit architectural constraints from the stack choice:**
- The application is architected as a **separate frontend (Next.js on Vercel) and backend (NestJS on Railway)**, not a single monolithic Next.js full-stack deployment — this is inferable from the fact that Vercel and Railway are billed/scoped as two distinct hosting line items.
- PostgreSQL via Prisma implies a relational schema is expected (consistent with the PRD's structured entities: Users, Listings, Payments, Messages, Ratings, Ads, Service Categories).
- Redis is called out specifically for **"listing alerts and rate-limiting"** (§3.2) — meaning at minimum the system is expected to support some form of user-facing alert/notification mechanism and API rate-limiting, even though the PRD's feature list doesn't separately name a "listing alerts" feature. **[NOTE: possible gap]** — this Redis-driven "listing alerts" capability is referenced only in the tech stack doc, not described anywhere in the PRD's feature scope (§6, §11.1). It may refer to an internal/notification mechanism rather than a user-facing feature, but this isn't clarified in either document.

**[MISSING / NOT SPECIFIED]** in the tech stack document:
- No mention of a specific state-management library, testing framework, mobile responsiveness implementation approach, or image-processing/optimization tooling.
- No API design style specified (REST vs GraphQL) — NestJS supports both, and the PRD's mention of "auto-generated API documentation" (§10) is consistent with either, most commonly OpenAPI/Swagger, but this is not named directly in the tech stack document.
- No CDN is confirmed as INCLUDED for Phase 1 — Cloudflare CDN is listed only as **FUTURE/optional** (§4).

---

## Summary of Flagged Gaps / Open Questions

For traceability, all points in this document marked as assumption or missing information are collected here:

1. No user research, personas, or quotes exist in the PRD — Section 4 (motivations/frustrations) is inferred from stated design rationale, not primary research.
2. No explicit emotional/UX tone document exists — Section 6 is inferred from feature intent, not a stated brand emotional journey.
3. Brand personality (Section 7) rests on a single sentence in the brand guidelines ("modern, approachable and trustworthy"); no values list, voice guide, or audience description exists beyond that.
4. No iconography, imagery, spacing/grid, or component-level UI system is defined in the brand guidelines (Section 8).
5. Redis's stated purpose includes "listing alerts" (tech stack doc, §3.2), a capability not described anywhere in the PRD's feature scope — flagged as a possible documentation gap between the two source documents (Section 10).
6. SMS provider cost for phone OTP is explicitly excluded from the approved cost sheet and left to the client to arrange (tech stack §1; PRD §14) — a constraint worth confirming is understood before implementation planning.
7. No API architecture style (REST/GraphQL), testing strategy, or state-management approach is specified in the tech stack document.
