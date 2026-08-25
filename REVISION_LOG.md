# NextHome — Revision Log (Client Review, 22 Aug 2026)

**Implemented:** 24 August 2026
**Sources:** `WEBSITE_REVISION_SPEC.pdf` (Implementation Spec & Brand Compliance, 24 Aug 2026) · `CLIENT_REVISION_REQUEST.md` (reconciliation against approved decisions) · Client review meeting, Saturday 22 August 2026 · Next Home Brand Guidelines PDF

This file exists because several of these changes **reverse or supersede decisions that were previously approved and reasoned**. CLAUDE.md's rule is not to change approved product requirements without explicit instruction — the spec is that instruction, but a decision that was reasoned once deserves a written record of what replaced it and why. Nothing below was changed silently.

Three kinds of entry:

- **AMENDMENT** — reverses or supersedes something explicitly approved. Needs formal sign-off to be considered settled.
- **NEW** — no prior decision covered it.
- **COMPLIANCE** — the approved decision was already correct; the code did not match it.

---

## 1. AMENDMENT — Property detail pages are now gated

**Was** (PRODUCT_DECISIONS.md §2, "Public Browsing Rules"): *"No authentication is required to: view a listing's full detail page, photos, and view count."* INFORMATION_ARCHITECTURE.md listed Listing Detail as `Public (listing must be live/approved)`, with only the *actions* on that page (Message, Save) gated.

**Now** (Spec §3B): anonymous visitors can browse the Listings page and see which properties are listed, but cannot open a full property detail page. Registration is required for full property info and every interactive feature.

**How it is implemented**

| Concern | Resolution |
|---|---|
| What an anonymous visitor sees | Exactly the fields the public listing **card** already shows — photo, headline, price, state, bedrooms, view count, verified badge. Never more than they saw on the card they clicked. |
| What is withheld | Gallery beyond the lead photo, description, specification, amenities, Message, Save. |
| Where it is enforced | `ListingDetailGate` — one branch, one place. The route still resolves, so shared links land on a real property instead of a 404. |
| Whether it actually leaks | No. The server reduces the record to a `ListingTeaser` **before** it crosses the client boundary, so gated fields are not in the HTML, the RSC payload, or the DOM. Verified by inspecting the response for an anonymous request. |

**The cost, stated plainly:** public detail pages were load-bearing for SEO and for conversion — a visitor could see enough to decide whether registering was worth it. That is now gone; detail pages are no longer indexable content. The registration wall mitigates the conversion half by naming exactly what registration unlocks, but the SEO loss is real and not recoverable by design work.

**⚠ Needs formal sign-off** as an amendment to PRODUCT_DECISIONS.md §2. This is the single highest-impact item in this revision.

---

## 2. AMENDMENT — "List Your Property" is role-gated, not always visible

**Was** (PRODUCT_DECISIONS.md §9 + IA Global Navigation): *"'Post Property' CTA — always visible (PRD §4), triggers gated-action flow if unauthenticated."*

**Now** (Spec §3A): shown only to a user who is registered **and currently acting as** Landlord. Both halves are required — holding the role is not enough, which is what gives the persistent role switcher its purpose.

Because no anonymous visitor can reach it, its auth-intercept (`ProtectedLink`) is gone; it is a plain link now.

**Related judgement call, flagged:** the homepage's closing CTA offered anonymous visitors "Post a property" via the same intercept. The spec names the *nav* specifically, so extending the rule there is an inference — made because leaving it would have put a landlord CTA one section below a nav that had just stopped showing one. See `src/components/home/ClosingCta.tsx`; it is a one-line revert if the client disagrees.

---

## 3. AMENDMENT — The role switcher is in the global nav

**Was** (INFORMATION_ARCHITECTURE.md, "Role Switching Access"): *"Reachable only from the Account/Profile area … never from the primary global nav."*

**Now** (Spec §3B): a persistent "Acting as: Renter — tap to switch" control in the header. A switcher inside a dropdown is not persistent in any sense the client would recognise.

It renders nothing for single-role users, and it is now the **only** role switcher in the product — the account dropdown's old "Active role" list was removed rather than left as a second control driving the same state. The account menu still *states* the active role, read-only.

---

## 4. NEW — Once-per-session role prompt

Spec §3B, and genuinely new: PRODUCT_DECISIONS.md §8 had role switching as manual and user-initiated only.

| Rule (spec, verbatim) | Where it lives |
|---|---|
| One role → placed into it automatically, no prompt | `resolveSession()` in `lib/auth-context.tsx` |
| Multiple roles → prompted **once**, at the start of a fresh session, never on every page load | `needsSessionRoleChoice`, latched through `sessionStorage` |
| The chosen role persists for the rest of that session | `nexthome:session-active-role` |
| Switchable mid-session without logging out | `setActiveRole()` rewrites the same key |
| Active role determines the default landing view | `roleLandingHref()` — Renter → `/listings`, others → `/dashboard` |

**One deliberate narrowing:** the landing redirect fires only from an entry point (`/`, `/login`). If someone opens a shared listing link and signs in there, they stay on that listing. Sweeping them to a dashboard would destroy the context the product works hard to preserve (PRODUCT_DECISIONS.md §10).

Dismissing the prompt (Escape / backdrop) keeps the pre-selected role and settles the session, so it never nags again.

---

## 5. NEW — Buy and Rent merged into one Listings page

Spec §3C. `/rent` and `/buy` are gone as destinations; `/listings` is the single route, with a pill toggle — the same interaction already approved and shipped for the Renter/Buyer context switch (PRODUCT_DECISIONS.md, 2026-08-21), so this reuses a proven pattern rather than introducing a second switching idiom.

- **Shareability kept:** mode is mirrored into `?mode=`, so a filtered Buy view is as linkable as it was when it had its own route.
- **Memory:** the toggle is remembered for the visit via `sessionStorage` (Spec §3C).
- **Price is cleared on switch**, everything else is kept — rent and sale are different scales, so a carried-over rent bucket would silently return nothing and read as an empty catalog.
- **Nothing 404s:** `/rent`, `/buy` and `/search` are redirect shims that forward the full filter vocabulary. Verified: `/rent?state=Lagos&bedrooms=2` → `/listings?state=Lagos&bedrooms=2&mode=rent`.

---

## 6. NEW — Navigation reduced to three items

Spec §3A. Top nav is now exactly **Listings · Log in · Register**.

| Removed | Went where |
|---|---|
| Home | The logo is the home link (Spec §3A). It carries an explicit accessible name and `aria-current`, which a labelled item gets for free and an unlabelled logo does not. |
| Rent, Buy | Merged into Listings (item 5). |
| Services, Help | Footer. Still routed, still reachable. |
| List Your Property | Role-gated (item 2). |

This supersedes IA's "Global/Public Navigation" subsection wholesale.

---

## 7. NEW — Multi-select roles at registration

Spec §3B. The account model already supported holding several roles (PRODUCT_DECISIONS.md §1/§8) and the account page could add them one at a time — but the registration screen forced a single choice, so the model's central promise was unreachable at the one moment most people would use it. That form is what changed, not the data model.

Roles are granted as one atomic set. A mixed registration is handled honestly: registering as Renter **and** Landlord activates Renter immediately while Landlord documents go to review — the final screen says both, rather than reporting one outcome for a mixed result.

**Scope note:** Service Provider and Advertiser are still offered, visually secondary to the two roles the client named. Removing approved product surface because it went unmentioned in one meeting would be a bigger decision than this revision authorises. See Open Item 5.

---

## 8. COMPLIANCE — Typography: one typeface again

DESIGN_SYSTEM.md §3 was already correct: *"Two-weight system per Brand Guidelines p.9 — no third typeface is introduced."* The code did not match it. A previous pass had added **Inter** as a "UI workhorse" face for dense/numeric content across 18 files. That is what the client saw as *"headings/body do not use the brand typeface."*

Inter is removed. Quicksand Bold/Medium now owns every heading, nav label, button, form field and card text sitewide.

The semantic classes that pointed at Inter (`.u-ui`, `.u-numeric`, `.u-label`) are **kept and repointed** at Quicksand, so the roles they encode survive as typographic treatments of the brand face — tracking opened slightly at small sizes, which is the in-family fix for the legibility problem Inter had been brought in to solve.

Only weights 500 and 700 are loaded. CSS font matching maps every Tailwind weight utility onto those two (`font-medium` → Medium; `font-semibold`/`font-bold` → Bold; unweighted body → Medium), so the two-weight system holds sitewide without auditing every utility class by hand.

---

## 9. COMPLIANCE — Colour: hex-by-hex audit

Spec §3D: *"Every color used sitewide must match one of the values below exactly. No approximated or invented shades."*

| Token | Was | Now |
|---|---|---|
| `--color-brand-primary-text` | `#037399` — brand Blue darkened for contrast | **Deep Blue `#1B537B`** (approved primary; 7.75:1 on white, 6.85:1 on Off-white) |
| `--color-surface-dense` | `#e7f0f0` | `color-mix(dark-blue 5%, off-white)` |
| `--color-border-default` | `#d7e6e6` | `color-mix(dark-blue 10%, off-white)` — which is what DESIGN_SYSTEM.md §2 literally specified all along |

Every value now resolves to one of the seven approved brand hexes or a documented mix of two of them.

**One consequence, handled on purpose:** brand text colour now equals `--color-text-secondary`, so hue can no longer carry the "active/link" state. Every such state is carried by **weight plus a Blue rule** instead — two cues that survive greyscale and colour-blindness, where a hue shift did not.

**The one remaining non-brand value, deliberately not resolved:** `--color-status-rejected` (`#b3452c`). The Brand Guidelines define no error colour, and rendering "rejected" in a blue from the same palette as "verified" would make two opposite states indistinguishable. It stays the flagged proposal it already was (IMPLEMENTATION_NOTES.md #1) — see Open Item 6.

---

## 10. Defects found and fixed while verifying this work

Not requested; found by testing the above in a browser, and each one a correctness bug rather than a polish item. All four are the same mistake — **an animation was gating something that had to be true regardless**.

| # | Defect | Fix |
|---|---|---|
| 1 | Listing grid rendered at `opacity: 0` until an entrance animation ran. If frames never arrived, the page's actual content was permanently invisible. | First paint renders outright; the entrance animation runs only for a user-initiated mode switch. |
| 2 | The header role switcher displayed the **previous** role after switching — `AnimatePresence mode="wait"` withheld the new label until the old one finished animating out. Its own screen-reader text already said the new role. | Keyed element, no exit animation. The name is correct immediately. |
| 3 | Body scroll lock was released on modal *unmount*, i.e. when an exit animation finished. A stalled frame loop left the page permanently unscrollable with no dialog on screen. | `useBodyScrollLock(active)`, driven by the owner's logical open state. |
| 4 | A dismissed dialog lingered as a `fixed inset-0` `aria-modal` element at `opacity: 0` — invisible, but still spanning the viewport and still swallowing every click. | `Overlay` has no exit animation. Enter is animated; dismissal is instant. |

**Also fixed:** the shared `Overlay` declared `aria-modal="true"` but had no Escape key, no focus movement, no focus trap and no focus restore — a modal in appearance only, against DESIGN_SYSTEM.md §13's existing requirement. Now implemented once, for every dialog in the product. Header touch targets on mobile were 32–36px against a 44px floor, which mattered more once Log in and Register became the whole mobile nav. And `(demo login)` was visible in the phone header, because `hidden lg:inline-flex` was fighting the Button base's own `inline-flex` and losing — this repo's `cn` is a plain join with no tailwind-merge.

---

## 11. NEW — Every Nigerian state and LGA, with LGA as a filter

**Source:** client-supplied workbook `States and LGAs.xlsx` (26 Aug 2026) — all 36 states plus the FCT, and all 774 Local Government Areas.

**Was:** the location dropdown offered six states (`Lagos, Abuja (FCT), Rivers, Oyo, Kano, Enugu`), hard-coded in three separate places — `SearchBar`, `listing-draft.ts`, and `PropertyBrowser`, which derived its list from whatever states the mock listings happened to use. A seeker outside those six could not describe where they were looking, and "state" was the finest grain available: "Lagos" covers twenty LGAs and roughly twenty million people, which is not a search result.

**Now:** one table — `lib/nigeria-locations.ts` — holds all 37 states and their 774 LGAs, and every location control in the product reads from it. A second filter, **Local Government Area**, sits directly under State and is scoped by it.

| Concern | Resolution |
|---|---|
| Where the list lives | `LGAS_BY_STATE` in `lib/nigeria-locations.ts`, generated from the client workbook. `NIGERIAN_STATES` is derived from its keys, so a state can never exist in one control and not another. |
| Search + filter | `SearchBar` (LGA appears inside the Location column once a state is chosen) and `FilterPanel` (a primary control, under State). Both read the same table. |
| Publishing | The listing wizard's Basics step now requires an LGA. A listing recorded only as "Lagos" is invisible to every LGA search, so making it optional would quietly punish the landlord who left it blank. |
| Cascade | Changing or clearing the state always clears the LGA — in the search bar, the filter panel, the chips, and the wizard. An LGA belongs to exactly one state; carrying a stale one would apply a filter the control cannot display. |
| URL | `?lga=` alongside `?state=`, so a filtered view stays shareable. An `lga` that does not belong to its `state` (hand-edited or stale link) is **dropped, not applied** — `filtersFromParams` validates the pair. |
| Display | `formatLocation(state, lga)` renders "Eti-Osa, Lagos" on cards, detail pages, the registration wall, and the landlord's listing view — one function, so the surfaces cannot drift. |
| Existing listings | `lga` is optional on `PropertyListing`; a listing without one still renders (state only) and simply never matches an LGA filter. The 16 mock listings were given their real LGAs. |
| Services | The directory filters by State and LGA too, on a coverage-area model rather than a single LGA — see the sub-entry below. |

**Data note.** Two names in the workbook carried stray spacing (`Ibeju- Lekki`, `Ila- Orangun`) and one an en dash (`Oshodi–Isolo`); these are normalised in the table. `KEEBI STATE` is recorded as **Kebbi**. FCT is spelled **Abuja (FCT)** — the label the listing data already used; renaming it would orphan every existing Abuja listing. Totals check out at 37 states / 774 LGAs.

### 11a. Services: coverage areas, and the LGA filter that needed them

The Services directory had **no location data at all** — `ServiceListing` carried a category, a provider name, a description and a verification flag, and nothing else. The homepage search bar acknowledged this with a disabled Location field reading *"Location filtering for services is coming soon"*. So "add the LGA filter to the services page" could not be a UI change alone; the record had to gain a location first.

**A trade is not a building.** A property sits in one LGA and that is the whole truth about it. An electrician based in Lagos Mainland works across Shomolu, Surulere and Ikeja, and recording only where they sleep would hide them from every customer in the other three. So services do **not** reuse the property model: they carry a coverage area.

| Concern | Resolution |
|---|---|
| Model | `ServiceListing` gains `state` and `lgas: string[]` — every LGA in that state the provider will travel to. An **empty list means the whole state**: a real answer (a mobile mechanic taking calls anywhere in Rivers), not missing data. |
| Matching | The LGA filter asks *"do you cover here?"*, not *"are you here?"* — `coversLga()` in `lib/nigeria-locations.ts`, one function, used by the directory. A statewide provider matches every LGA in their state. |
| Directory | State and LGA selects under the category chips, seeded and validated from `?state=` / `?lga=`. Category, state and LGA combine with AND. |
| Homepage search bar | The Location field is **live in Services mode now**, LGA included, and both are carried into `/services?…`. Leaving it disabled would have the homepage denying a filter the page it links to actually has. |
| Provider form | `/dashboard/service-listing` asks for a state, then a checklist of that state's LGAs with a running count, plus one "I cover the whole state" control so nobody has to tick forty-four boxes. Submitting with a state and no areas is blocked — it would publish a listing that matches no search at all. |
| Display | Cards abbreviate ("Lagos Mainland, Shomolu +2 more, Lagos", or "Rivers — statewide"); the provider's detail page names **every** area served, since that is the page where a customer checks for their own LGA. |
| Empty results | A location filter can genuinely empty this directory — five providers against 774 LGAs. The empty case says so and offers Clear filters, rather than showing a bare grid. |

**Scope note on the model.** Coverage is expressed within **one** state. A provider working across a state line (Ogun and Lagos, say) is not representable today; that would be `coverage: { state, lgas }[]`, and it is a bigger change than the client asked for. Flagged rather than guessed at.

---

**Scope note.** PRODUCT_DECISIONS.md §40 enumerates the approved filter set as state, price, bedrooms, and Short-Term/Long-Term. LGA is a fifth dimension, added on the client's instruction and their own data. It is a *narrowing* of the existing location filter rather than a new kind of filter, and it keeps the PRD's rule that location is a fixed dropdown and never free text. The Services directory previously had no location filter of any kind; §11a records what giving it one required.

---

## Open items — still need client confirmation

Carried forward from Spec §4 and the revision request. **None of these were guessed at**; each has a documented interim and a single place to change it.

| # | Question | Interim | Where it changes |
|---|---|---|---|
| 1 | Is walling off the full detail page genuinely intended, given it reverses a reasoned public/SEO decision? | Implemented as specified | `ListingDetailGate` |
| 2 | Exact teaser field list for an anonymous visitor | Card parity — never more than the card showed | `ListingTeaser` in `lib/types.ts` |
| 3 | Exact destination for relocated Services/Help | Footer (the destination the spec names first, and where they already lived) | `Footer.tsx` |
| 4 | First-visit default for the Buy/Rent toggle | `rent` — a continuation of the old `/search` default, not a new guess | `DEFAULT_MODE` in `lib/listings-mode.ts` |
| 5 | Are Service Provider and Advertiser still in scope? | Still offered, visually secondary | `SECONDARY_ROLES` in `app/register/page.tsx` |
| 6 | Brand-owner decision on an error/rejected colour | Flagged proposal, unchanged | `--color-status-rejected` |
| 7 | Logo-as-home vs. an explicit label | Logo (the spec's own recommended default) | `Header.tsx` |
| 8 | Can a service provider cover **more than one state**? (Multi-LGA coverage within a state is implemented — §11a.) | Coverage is a list of LGAs inside one state; an empty list means statewide | `ServiceListing.lgas` in `lib/types.ts` (§11a) |

Also unchanged and still open: everything in [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md). None of those nine items were silently resolved by this pass.
