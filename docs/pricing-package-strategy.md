# Pricing Package Strategy (PM View)

Date: 2026-02-08

## Objective
Align public pricing (`/pricing`), registration plan selection (`/register`), and billing/catalog logic under one 3-tier model tied to actual product scope.

## Source of truth
- Technical plan IDs: `starter`, `growth`, `scale`
- Plan limits: `lib/billing/plans.ts`
- Billing package content: `lib/i18n/messages.ts` (`billing.plans.*`)

## 3-package structure

### 1) Starter
- Target: small teams launching first CRM + proposal flow
- Price: `$29 / user / month`
- Core value: essential CRM and proposal operations
- Key limits: `3 users`, `10 proposals/month`, `5 GB storage`

### 2) Growth (Recommended)
- Target: teams scaling revenue motion and collaboration
- Price: `$79 / user / month`
- Core value: team execution + automation + integrations
- Key limits: `10 users`, `200 proposals/month`, `50 GB storage`
- Feature differentiators: team roles/assignment, webhook/API/Twilio, analytics + reporting

### 3) Scale
- Target: high-volume teams needing operational visibility and controls
- Price: `$149 / user / month`
- Core value: advanced operations and governance
- Key limits: `25 users`, `unlimited proposals`, `200 GB storage`
- Feature differentiators: monitoring, API usage visibility, advanced integration operations, onboarding support

## Why this is consistent with product scope
The platform already includes advanced modules such as:
- Team roles and assignment
- Webhooks and API integrations
- Monitoring and usage logs
- Analytics and reporting surfaces

A 3-tier model better reflects this breadth than a 2-tier public plan.

## Implementation notes
- `/pricing` now uses `starter/growth/scale` IDs directly for CTA handoff.
- `normalizePlanId` keeps legacy alias support (`solo/pro/team`) to avoid breaking old links.
- Comparison table and structured data were updated to 3 offers.

## Acceptance checklist
- [x] `/pricing` displays 3 plans
- [x] CTA query uses `starter|growth|scale`
- [x] `/register` preselect works for all 3 plans
- [x] Structured data reflects all 3 offers
- [x] Docs updated for decision traceability
