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
- Pricing CTAs now pass internal `plan` IDs (`starter`, `growth`, `scale`)
- Register page still normalizes legacy aliases (`solo`, `pro`, `team`) for backward compatibility
- Plan preselection is applied automatically from query string
- After auth verification/login, users continue with `/settings/billing?source=marketing&plan=...`
- Billing page shows pending marketing plan intent banner when current plan differs
- Recovery states are available on `/checkout/retry` and `/checkout/pending`

## Next implementation steps
- Optional: create platform-level Stripe checkout endpoint for fully anonymous checkout in a later phase
