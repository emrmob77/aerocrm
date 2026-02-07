# Marketing IA + Route Map

Date: 2026-02-07

## Goal
- Separate public marketing experience from authenticated dashboard flows.
- Keep URLs clean, SEO-friendly, and conversion-oriented.
- Avoid conflicts with existing authenticated routes.

## Current Route Constraints
The following routes are already used by authenticated dashboard pages and must not be reused for public marketing pages:
- `/integrations`, `/settings`, `/reports`, `/contacts`, `/deals`, `/proposals`, `/templates`, `/analytics`, `/notifications`, `/products`, `/search`, `/sales`, `/webhooks`

## Public Marketing Routes (Approved)
- `/` -> Marketing home
- `/pricing` -> Pricing and plans
- `/features` -> Product features
- `/platform/integrations` -> Public integrations overview (uses `/platform` namespace to avoid `/integrations` conflict)
- `/security` -> Security and trust
- `/faq` -> Frequently asked questions
- `/contact` -> Contact and lead form
- `/book-demo` -> Demo booking CTA page
- `/checkout/success` -> Post-purchase success state
- `/checkout/cancel` -> Post-purchase cancel state
- `/terms` -> Legal terms
- `/privacy` -> Privacy policy
- `/help` -> Public help hub

## Authenticated Core Routes (Protected)
- `/dashboard` and all business operation pages (deals, contacts, proposals, billing, etc.)

## Navigation Model (Marketing Header)
- Primary links:
  - `Features` -> `/features`
  - `Pricing` -> `/pricing`
  - `Integrations` -> `/platform/integrations`
  - `Security` -> `/security`
  - `FAQ` -> `/faq`
  - `Contact` -> `/contact`
- Right-side actions:
  - `Log In` -> `/login`
  - `Get Started` -> `/register`

## Footer Model
- Product: Features, Pricing, Integrations
- Company: Contact, Help
- Legal: Terms, Privacy
- CTA: Book demo

## Funnel Mapping
1. Awareness: `/`, `/features`, `/platform/integrations`, `/security`
2. Consideration: `/pricing`, `/faq`, `/contact`
3. Intent: `/register?plan=...`, `/book-demo`
4. Purchase outcome: `/checkout/success`, `/checkout/cancel`

## Notes
- Public marketing pages live under `app/(marketing)` route group.
- URLs remain clean because route groups do not appear in public path.
- This mapping is compatible with Sprint S1-01 and S1-02 tasks.
