# Marketing Checkout Flow Decision

Date: 2026-02-07

## Decision
Public visitors should not call `/api/billing/checkout` directly.

Current checkout API requires:
- Authenticated user session
- Team context (`users.team_id`)
- Team-level connected Stripe integration

Because of this constraint, the purchase funnel for anonymous traffic is:
1. Visitor selects plan on `/pricing`
2. CTA routes to `/register?plan=...`
3. Plan is preselected on register page
4. User completes auth flow, then continues to billing flow in-app

## Implemented in this sprint
- Pricing CTAs now pass `plan` query (`solo`, `pro`)
- Register page normalizes marketing aliases to internal plan IDs (`starter`, `growth`, `scale`)
- Plan preselection is applied automatically from query string

## Next implementation steps
- After auth verification/login, route user to `/settings/billing` with intent context
- Add in-app banner on billing page for pending plan intent
- Optional: create platform-level Stripe checkout endpoint for fully anonymous checkout in a later phase
