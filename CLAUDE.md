# NextHome Frontend Instructions

## Project
This is the frontend for the NextHome real estate marketplace.

## Source of Truth
Before making major UI or product changes, follow the existing project documentation:

- Original PRD
- Brand Guidelines
- PRODUCT_UNDERSTANDING.md
- PRODUCT_DECISIONS.md
- DESIGN_INTENT.md
- USER_JOURNEYS.md
- INFORMATION_ARCHITECTURE.md
- DESIGN_DIRECTIONS.md
- DESIGN_SYSTEM.md
- SCREEN_BLUEPRINTS.md
- COMPONENT_ARCHITECTURE.md
- WIREFRAME_PLAN.md
- RESPONSIVE_STRATEGY.md
- IMPLEMENTATION_NOTES.md

Do not change approved product requirements or brand guidelines without explicit instruction.

## Design Rules
- Preserve the approved NextHome brand identity.
- Do not replace brand colors, typography, logo, or visual rules.
- Do not make the UI look like a generic real-estate template.
- Keep public property discovery warm and approachable.
- Keep dashboards efficient, clear, and task-focused.
- Trust and verification should be structural, not decorative.
- Reuse existing components and design tokens before creating new ones.

## Code Rules
- Use the existing Next.js App Router architecture.
- Use TypeScript.
- Use Tailwind CSS and existing design tokens.
- Reuse components instead of duplicating UI.
- Do not add unnecessary dependencies.
- Use Motion only from `motion/react`.
- Respect reduced-motion preferences.
- Do not break existing routes or functionality while fixing another issue.

## Workflow
When fixing an issue:
1. Inspect the relevant existing code first.
2. Identify the root cause.
3. Make the smallest correct change.
4. Preserve existing working functionality.
5. Check desktop, tablet, and mobile behavior.
6. Check accessibility where relevant.
7. Run relevant validation after the change.

## Important Product Rules
- Public users can browse available content without logging in.
- Protected actions should trigger the approved authentication flow.
- Preserve the user's original context after authentication.
- Tenant/Buyer and Landlord experiences must remain role-aware.
- Multiple roles must remain independent.
- Do not silently resolve items listed in IMPLEMENTATION_NOTES.md.

## Before Finishing
For significant changes:
- Run lint.
- Run build where practical.
- Report files modified.
- Report what was changed.
- Report any unresolved issues.

## Do Not
- Do not invent product requirements.
- Do not overwrite planning documents.
- Do not redesign unrelated parts of the application.
- Do not add random animations or decorative effects.
- Do not use placeholder branding when approved brand assets exist.