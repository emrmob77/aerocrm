# Marketing Guideline

Date: 2026-02-07

## Purpose
This guideline standardizes the public marketing surface (`/`, `/pricing`, `/features`, `/platform/integrations`, `/security`, `/faq`, `/contact`, `/book-demo`) for consistent conversion and copy quality in TR/EN.

## Brand Voice
- Tone: clear, pragmatic, sales-operations focused
- Promise: reduce proposal cycle time, improve deal visibility, accelerate revenue execution
- Avoid: generic hype claims and vague enterprise jargon

## Page Structure Standard
1. Hero
- One direct outcome statement
- One primary CTA (`View Pricing` / `Planları Gör`)
- One secondary CTA (`Book Demo` / `Canlı Demo`)

2. Proof or capability block
- 3 to 6 concise benefit cards
- Each card: short title + one-line description

3. Conversion block
- Clear next step (register, contact, or billing handoff)
- No dead-end actions

## CTA Standards
- Primary CTA style: solid blue button
- Secondary CTA style: outlined button
- CTA copy pattern:
  - TR: action-first (`Planları Gör`, `Hesap Oluştur`, `Demo planla`)
  - EN: action-first (`View Pricing`, `Create Account`, `Book demo`)

## Packaging Standard
- Pricing page must always expose 3 tiers mapped to product plan IDs:
  - `starter`
  - `growth` (recommended)
  - `scale`
- Public pricing IDs must match register and billing IDs directly.
- Legacy aliases (`solo`, `pro`, `team`) are accepted only as backward-compatibility redirects.

## Copy Standards
- Keep sentence length under ~18 words when possible.
- Use concrete outcomes (time saved, fewer manual steps, better visibility).
- Keep equivalent intent between TR and EN versions.
- Do not mix TR and EN blocks in the same paragraph.

## Navigation Standards
- Header links: Features, Pricing, Integrations, Security, FAQ, Contact
- Right actions: Log In + Get Started
- Footer groups: Product, Company, Legal

## Conversion Event Standards
Track at minimum:
- Page views (`FUNNEL_VIEW`)
- CTA clicks (`FUNNEL_CTA`)
- Flow transitions (`FUNNEL_FLOW`)

Mandatory funnel milestones:
- Landing view
- Pricing view
- Checkout start (plan intent)
- Checkout success/cancel/retry/pending
- Contact submit start/success/error

## SEO Standards
- Each public page must include:
  - title
  - description
  - canonical
  - Open Graph
  - Twitter card
  - robots policy
- Include JSON-LD where relevant:
  - Home: SoftwareApplication
  - Pricing: Product/Offer
  - FAQ: FAQPage

## Accessibility and UX Baseline
- Minimum color contrast for text actions
- Keyboard reachable CTAs and links
- Mobile-first spacing and readable line lengths
- Avoid hidden critical actions behind hover-only interactions

## Purchase UX States
Billing lifecycle states must be explicit:
- Active / Trialing
- Past due / Unpaid
- Incomplete / Pending verification
- Canceled

Each non-happy state must provide a recovery action:
- Retry page
- Pending page
- Stripe portal
- Contact sales
