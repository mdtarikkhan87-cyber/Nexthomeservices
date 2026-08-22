# NextHome — Design Directions

**Status:** Design exploration — three candidate directions for review. No direction has been selected. No design system, components, or wireframes exist yet.
**Sources used:** `Next Home Brand Guidelines.pdf`, `NextHome_PRD_Phase1_Final.pdf`, [PRODUCT_UNDERSTANDING.md](PRODUCT_UNDERSTANDING.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [DESIGN_INTENT.md](DESIGN_INTENT.md), [USER_JOURNEYS.md](USER_JOURNEYS.md), [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md).

All three directions operate within the same brand assets (Quicksand typeface, Deep Blue/Blue/Light Blue palette, house-and-cloud logo) and the same approved IA — they differ in *what gets emphasized* and *how the interface behaves*, not in what's allowed to exist. Each direction below pushes on a different one of the brand's own three stated qualities — "modern, approachable and trustworthy" (Brand Guidelines p.9) — as its dominant organizing idea, which is why they produce genuinely different structures rather than three palettes on one layout.

---

## Direction A: "The Trust Ledger"

### 1. Direction Name
The Trust Ledger

### 2. Core Design Philosophy
Trust is not a feeling to evoke — it's a set of facts to display. Every screen is organized around making verification, status, and evidence the structural skeleton of the layout, not a badge added on top. This direction takes DESIGN_INTENT.md Principle 1 ("every listing and profile must show its trust state before anything else") as the literal governing rule for the entire visual system, not just card design.

### 3. Primary Visual Concept / Metaphor
A verified record or ledger entry. Listings, provider profiles, and dashboard items are treated like entries in a trustworthy register — each with a consistent, almost document-like anatomy: status stamp first, then facts, then action. The house-and-cloud logo's structural, architectural linework (not its softness) is the visual cue this direction leans into.

### 4. Layout and Information Hierarchy Approach
Strong, consistent horizontal banding: a status/verification strip sits at the top of every card and every detail page, visually separated (not just colored) from the content beneath it. Grids are regular and aligned, evoking a register or table even when rendered as cards. Typography hierarchy is driven by *state* first, *content* second — a "Verified" or "Pending Review" label is set at a size/weight comparable to the price, not subordinate to it.

### 5. Public Browsing Experience Approach
Search results present as a structured, scannable list-grid hybrid where every card's status strip is identical in position and treatment, so a user can scan down a column of listings and compare trust signals as easily as prices. Filtering is presented as a persistent side panel (not a collapsing drawer) — always visible, reinforcing the "nothing hidden" ethos.

### 6. Dashboard Experience Approach
Dashboards read like an audit view: a status table/list is the default view for My Listings, My Service Listing, My Advertisements — explicit columns (or clearly separated rows) for state, not icons alone. Pending/rejected items are pinned to the top algorithmically, not just styled differently, directly implementing DESIGN_INTENT.md §4's "status-oriented" dashboard principle.

### 7. Navigation Approach
Persistent, always-visible primary navigation (no hamburger collapse on desktop) — nothing about where the user can go should require discovery. Role switching and verification status live together in a single, always-reachable account strip, reinforcing that identity/trust state is structurally part of navigation, not buried in a settings page.

### 8. Typography and Spacing Philosophy
Quicksand Bold reserved almost exclusively for state labels and prices — the two facts DESIGN_INTENT.md identifies as most load-bearing. Body copy (Quicksand Medium) stays smaller and more restrained than in the other two directions, to avoid competing with status information. Spacing is generous around status elements specifically (per DESIGN_INTENT.md §3's "trustworthy = generous spacing around identity/transaction elements"), tighter elsewhere for density.

### 9. Use of Imagery, Maps, Data, or Visual Content
Photos are present but deliberately not dominant — capped aspect ratios, consistent crop, never full-bleed hero treatment on cards. View counts and simple numeric indicators (e.g., "12 views this week") are treated as first-class content, not small print, reinforcing the evidence-based framing. No map view is proposed here — the PRD's approved filters are list-based (state dropdown, price, bedrooms), and this direction doesn't invent a mapping feature.

### 10. Interaction and Motion Philosophy
Minimal, purely functional motion — state changes (pending → verified) get a brief, deliberate acknowledgment (per DESIGN_INTENT.md §8) but nothing decorative. No hover-triggered reveals that hide information by default; if it's a scannable fact, it's always visible, never revealed only on interaction.

### 11. Strengths
- Most directly and literally executes the "trustworthy" brand pillar and DESIGN_INTENT.md's dominant principle.
- Scales cleanly to dense, status-heavy dashboards (Landlord managing many listings, Admin approvals).
- Low risk of accidentally hiding a trust signal, since the system is built around never doing that.

### 12. Risks or Weaknesses
- Can read as cold or clinical if not balanced carefully — risks underserving the "approachable" brand pillar.
- Public browsing (a discovery/emotional decision for a Tenant/Buyer looking for a home) may feel more like using a compliance tool than finding a place to live.
- Requires disciplined design-system governance to keep the "status strip" pattern consistent everywhere; a shortcut anywhere undermines the whole premise.

### 13. Risk of Becoming Generic
Low. The status-forward, ledger-like structure is distinctive relative to typical real-estate sites (which usually lead with photography). The main risk isn't genericness — it's over-correcting into something that feels more like a compliance dashboard than a marketplace, if not paired with careful typography/warmth choices.

---

## Direction B: "The Neighborhood Welcome"

### 1. Direction Name
The Neighborhood Welcome

### 2. Core Design Philosophy
Trust is earned partly through warmth, not just evidence — people decide to message a landlord about a *home*, not a database record. This direction leans into the "approachable" brand pillar as the dominant idea: the rounded Quicksand letterforms and the house/cloud logo's soft, human silhouette are treated as the design's real center of gravity, and trust signals are woven in rather than structurally dominant.

### 3. Primary Visual Concept / Metaphor
Arriving at a neighborhood — the sense of a welcoming, human-scaled place rather than a system. Rounded corners, soft shadows, and generous breathing room throughout evoke the cloud motif from the logo. Content is framed more like a curated introduction ("here's a home, here's who's offering it") than a database row.

### 4. Layout and Information Hierarchy Approach
Larger, more generous card treatments with photography given real visual weight — imagery leads, supporting facts (price, location, bedrooms) sit close beneath in a clear but secondary block, and the Verified badge is a warm, consistent visual mark (not a data-table-style label) rather than a stamp. Hierarchy is achieved through scale and whitespace rather than banding/strips.

### 5. Public Browsing Experience Approach
A more editorial, magazine-like results layout — larger cards, fewer per row, more breathing room — that favors a slower, more considered scan rather than rapid comparison. Filters are approachable and conversational in labeling ("Any budget," "2+ bedrooms") rather than terse form controls, while still respecting the PRD's fixed filter set (state dropdown, price, bedrooms, Short-Term/Long-Term).

### 6. Dashboard Experience Approach
Dashboards stay warm and personal rather than table-like — a Landlord's "My Listings" reads more like a gallery of their properties with clear, friendly status chips, and the dashboard home page opens with a personal, conversational summary ("You have 2 new messages and 1 listing pending review") rather than a raw stat table. Still fully satisfies DESIGN_INTENT.md §4's requirement that pending/urgent items surface first — just expressed conversationally rather than tabularly.

### 7. Navigation Approach
Simpler, more minimal top navigation with fewer simultaneously visible items, relying on a friendly, clearly-labeled account menu for everything role/account-related — favors calm and approachability over Direction A's "everything always visible" density.

### 8. Typography and Spacing Philosophy
Quicksand Bold used more liberally and at larger sizes for headlines and welcoming copy, leaning into the "modern, approachable" pairing directly. Generous whitespace is the default everywhere, not just around trust elements — this direction treats spacious layout itself as part of the trust signal (an uncluttered, unhurried interface feels less like a scam operation), consistent with DESIGN_INTENT.md §3's spacing guidance but applied more broadly.

### 9. Use of Imagery, Maps, Data, or Visual Content
Photography is the dominant visual content — large, high-quality hero images on listing cards and detail pages. View counts and other numeric facts are presented as small, friendly annotations rather than headline data. No map view proposed (same reasoning as Direction A — not in approved scope).

### 10. Interaction and Motion Philosophy
Soft, welcoming micro-interactions — gentle easing on hover/tap states, a warm save/message confirmation moment — always within DESIGN_INTENT.md §8's reduced-motion and non-decorative rules, but with slightly more expressive transitions than Direction A allows, since motion here is also doing emotional work (warmth), not just state-communication work.

### 11. Strengths
- Most directly executes the "approachable" brand pillar and is likely the most emotionally engaging for a Tenant/Buyer's home-search moment, which DESIGN_INTENT.md §2 identifies as an evaluative, sometimes-skeptical mindset that warmth can help soften.
- Differentiates NextHome from utilitarian/classifieds-style competitors, directly addressing the PRD's stated goal of feeling like an upgrade from WhatsApp groups and classifieds.
- Naturally accommodates the brand's rounded, friendly typography and logo motif without fighting them.

### 12. Risks or Weaknesses
- Highest risk of the three directions of trust signals becoming visually secondary if not disciplined — warmth must not be allowed to push Verified status, pending states, or subscription status below the fold or below imagery, which would directly violate DESIGN_INTENT.md Principle 1.
- Larger, sparser cards mean fewer listings visible per scroll — a real tradeoff against fast comparison shopping, which some visitors will want.
- Dense dashboard use cases (many listings, many messages) may feel less efficient than Direction A or C.

### 13. Risk of Becoming Generic
Moderate-high if not executed carefully — "warm, photo-led, rounded, spacious" is also the default aesthetic of a large share of modern consumer marketplaces and could blur into generic Airbnb-adjacent visual language without a genuinely distinct point of view (e.g., a distinctive way of presenting the Verified badge, or a distinctive card anatomy) to anchor it back to NextHome specifically.

---

## Direction C: "The Working Marketplace"

### 1. Direction Name
The Working Marketplace

### 2. Core Design Philosophy
The platform is, first and foremost, a functional tool people use to get something done quickly — find a home, get a message answered, get a listing published. This direction leans into "modern" interpreted specifically as efficient, no-friction, information-dense — closest in spirit to the PRD's own housing.com-inspired reference points (§4: instant filter updates, scannable cards, always-visible primary CTA) pushed further toward density and speed than either Direction A or B.

### 3. Primary Visual Concept / Metaphor
A well-run control room / operations view — not cold like Direction A's ledger, but brisk and capable, like a tool a busy professional trusts because it's fast and gets out of their way. The logo's forward-pointing chevrons (`>>>`) are the visual anchor here: motion-forward, efficient, always moving toward the next action.

### 4. Layout and Information Hierarchy Approach
Compact, high-density grids — more listings visible per screen than either other direction, smaller card footprint, information presented in tight, well-organized clusters rather than generous blocks. Hierarchy is achieved primarily through typographic weight/size contrast within a small footprint, not through spacing or imagery scale.

### 5. Public Browsing Experience Approach
Filters and results share the screen simultaneously wherever viewport allows (persistent filter sidebar + live-updating dense grid), most directly implementing the PRD's explicit "results updating instantly" aspiration (§4). Optimized for a visitor who already knows roughly what they want and is comparing many options quickly.

### 6. Dashboard Experience Approach
Dashboards are the most data-forward of the three — closer to a lightweight admin/ops tool than a consumer app, with compact tables, inline status chips, and minimal decorative framing. This direction would push dashboard density further than DESIGN_INTENT.md §4's baseline guidance strictly requires, trading some warmth for speed — appropriate if Landlords/Service Providers managing multiple listings are expected to value efficiency most.

### 7. Navigation Approach
Dense but highly efficient navigation — likely a persistent compact sidebar for authenticated areas (dashboard, messages, account) rather than a top bar, maximizing content area and keeping every destination one click away without scrolling through a long top nav.

### 8. Typography and Spacing Philosophy
Quicksand Medium dominant throughout (even in headings, sized rather than weighted for hierarchy), spacing kept tight and consistent via a strict, small-increment grid — legible and orderly rather than expressive. This direction uses the brand's "modern" and "approachable" roundness more subtly (rounded corners on controls, not rounded generous whitespace) so density doesn't read as harsh.

### 9. Use of Imagery, Maps, Data, or Visual Content
Photos are present but compact (thumbnail-scale in list views, full-size only on the detail page) — data density is prioritized over visual storytelling. View counts, pricing, and status are presented as compact inline stat groups. No map view proposed (same reasoning as the other two directions).

### 10. Interaction and Motion Philosophy
Fast, snappy, minimal-duration transitions — motion exists almost exclusively to communicate state changes instantly (per DESIGN_INTENT.md §8's purpose rule) with no lingering easing; this direction treats motion primarily as a performance/clarity tool, the leanest interpretation of DESIGN_INTENT.md's motion principles among the three.

### 11. Strengths
- Best matches the PRD's own explicit inspiration (housing.com's instant filtering, scannable dense cards) and its practical, business-first framing ("it isn't a demo — it's a working business from launch," PRD §2).
- Most scalable for power users — a Landlord managing many listings, or a Tenant/Buyer comparing many options — and for a growing catalog over time.
- Efficient use of screen space likely performs well across the PRD's required device range (phone, tablet, desktop — PRD §11.1).

### 12. Risks or Weaknesses
- Highest risk among the three of underserving the "approachable" and even "trustworthy" pillars if density crowds out the breathing room DESIGN_INTENT.md §3 calls for around identity/transaction elements — needs deliberate discipline to avoid cramming Verified status.
- Least emotionally distinctive of the three — closest to "generic efficient marketplace" territory by design.
- Compact dashboards risk feeling like an internal tool rather than a consumer-facing product if not balanced with brand personality.

### 13. Risk of Becoming Generic
Highest of the three. Density-first, efficiency-first marketplace design is a well-worn pattern (classic property portals, job boards, e-commerce comparison sites) and this direction's biggest execution risk is failing to differentiate NextHome from that broader category — it would need a genuinely distinctive typographic or interaction signature (not just "compact") to avoid feeling interchangeable with any other listings platform.

---

## Comparison Table

| Dimension | A: The Trust Ledger | B: The Neighborhood Welcome | C: The Working Marketplace |
|---|---|---|---|
| **Trust** | Strongest — trust state is the literal structural skeleton | Moderate — trust signals present but must be deliberately protected from being visually subordinated to imagery/warmth | Moderate — trust signals present but at risk of being visually crowded by density |
| **Property Discovery** | Good for comparison, less emotionally engaging | Strongest for emotionally-led discovery (a home, not a record) | Strongest for fast, high-volume comparison shopping |
| **Role-Based Complexity** | Strongest — status/state-first structure scales cleanly across many roles and many state layers (account/role/content-item) | Moderate — warmth-led framing works less naturally for dense multi-role/multi-state management screens | Strong — dense, table-like structure handles multi-role complexity efficiently |
| **Information Density** | High | Low (deliberately spacious) | Highest |
| **Brand Alignment** | Strongest on "trustworthy"; weakest on "approachable" unless balanced | Strongest on "approachable"; weakest on "trustworthy" prominence unless disciplined | Strongest on "modern"/efficient; weakest on "approachable" warmth |
| **Scalability** (more listings, more roles, more content over time) | Strong | Weaker — spacious cards don't scale to large catalogs as gracefully | Strongest |
| **Distinctiveness** (vs. generic real-estate sites) | Strong — status-forward structure is uncommon in this category | Moderate — risks blending into generic warm-marketplace aesthetics without a distinct anchor | Weakest — closest to well-worn category conventions |

---

No direction has been selected. Each has genuine, different tradeoffs against the approved DESIGN_INTENT.md principles and IA — none is a strictly dominant choice, and the decision should weigh which brand pillar (trustworthy / approachable / modern) and which usage pattern (emotional discovery vs. dense management) matters most as the primary lens, while the other two directions' strongest ideas can still inform detail decisions later regardless of which is chosen.

**DIRECTION SELECTION REQUIRED BEFORE DESIGN SYSTEM.**
