# Marketing + Purchase Funnel Sprint Plan

Date: 2026-02-07

## Objective
- Build high-converting public pages and a reliable purchase funnel.
- Connect landing traffic to signup, checkout, and subscription lifecycle.
- Standardize copy, design, tracking, and post-purchase flows in TR/EN.

## Scope
- Public pages: `/`, `/pricing`, `/contact`, `/features`, `/platform/integrations`, `/security`, `/faq`, `/book-demo`
- Purchase pages: `/checkout/success`, `/checkout/cancel`, retry/pending states
- Funnel events: page view, CTA click, pricing view, checkout start/success/cancel
- SEO and trust foundations: metadata, structured data, legal links, performance/accessibility

## Owner Model
- `PD`: Product
- `UX`: UI/UX
- `FE`: Frontend
- `BE`: Backend
- `GR`: Growth/Marketing
- `QA`: Quality
- `DEVOPS`: Deployment/Infra

## Sprint 1 (Foundation + Core Funnel)

| ID | Task | Owner | Effort | Dependency | Done When |
|---|---|---|---|---|---|
| S1-01 | Create marketing IA and route map | PD + UX | 1d | None | Final page tree approved |
| S1-02 | Create `app/(marketing)` layout/navbar/footer | FE | 2d | S1-01 | Shared layout active on all public pages |
| S1-03 | Redesign homepage (`/`) with conversion sections | FE + UX | 3d | S1-02 | Hero + proof + CTA + mobile complete |
| S1-04 | Build full pricing page (`/pricing`) | FE + UX | 3d | S1-02 | Plan table, FAQ, CTA, yearly toggle ready |
| S1-05 | Plan preselect flow (`/register?plan=`) | FE + BE | 1d | S1-04 | Pricing CTA opens register with selected plan |
| S1-06 | Define checkout flow for non-auth marketing users | PD + BE | 1d | S1-05 | Final flow decision documented |
| S1-07 | Implement checkout handoff from marketing to billing API | FE + BE | 2d | S1-06 | User can start checkout from pricing path |
| S1-08 | Add post-checkout pages (`success`, `cancel`) | FE | 1d | S1-07 | Clear state pages live with next actions |
| S1-09 | Add funnel analytics events | FE + GR | 1d | S1-03,S1-04 | Events visible in analytics/log pipeline |
| S1-10 | Add baseline SEO (meta/canonical/OG/Twitter) | FE | 1d | S1-03 | Public pages have proper metadata |

## Sprint 2 (Trust + Lifecycle + Content Quality)

| ID | Task | Owner | Effort | Dependency | Done When |
|---|---|---|---|---|---|
| S2-01 | Build contact page and lead form backend | FE + BE | 2d | S1-02 | Form submits, validates, logs successfully |
| S2-02 | Add spam/rate-limit/anti-abuse on contact form | BE | 1d | S2-01 | Abuse protection active and tested |
| S2-03 | Build trust pages (`/security`, `/faq`, `/integrations`) | FE + UX | 3d | S1-02 | All pages complete in TR/EN |
| S2-04 | Wire legal pages in marketing nav/footer | FE | 0.5d | S1-02 | Terms/Privacy always reachable |
| S2-05 | Add trial/upgrade/downgrade/cancel/reactivate UX states | FE + BE | 3d | S1-08 | Lifecycle states visible and actionable |
| S2-06 | Add retry-payment and pending-verification pages | FE | 1d | S2-05 | Failed/pending payments have recovery paths |
| S2-07 | Create `docs/marketing-guideline.md` (copy + visual standards) | UX + GR | 1d | S1-03 | Guideline approved and versioned |
| S2-08 | TR/EN copy parity pass for all marketing pages | GR + FE | 1d | S2-03,S2-07 | No fallback keys and no mixed language blocks |
| S2-09 | Add JSON-LD schemas (SoftwareApplication, FAQ, Product) | FE | 1d | S1-10,S2-03 | Structured data valid in rich-results testing |
| S2-10 | Checkout + webhook lifecycle E2E tests | QA + BE | 2d | S2-05,S2-06 | Happy/failure paths automated |

## Sprint 3 (Optimization + Experimentation + Launch)

| ID | Task | Owner | Effort | Dependency | Done When |
|---|---|---|---|---|---|
| S3-01 | Funnel dashboard (Landing -> Pricing -> Signup -> Paid) | BE + GR | 2d | S1-09 | Conversion metrics visible by date range |
| S3-02 | A/B test framework for Hero/CTA/Pricing variants | FE + GR | 2d | S1-03,S1-04 | Variant assignment and tracking stable |
| S3-03 | Performance budget + optimization pass (LCP/CLS/INP) | FE | 2d | S1-03,S2-03 | Public pages meet budget targets |
| S3-04 | Accessibility pass (WCAG 2.1 AA) | FE + QA | 2d | S2-03 | Keyboard/contrast/screen-reader checks pass |
| S3-05 | Final launch checklist + rollback runbook | PD + DEVOPS | 1d | S3-01..S3-04 | Go-live checklist approved |
| S3-06 | Post-launch monitoring and alert thresholds | DEVOPS + BE | 1d | S3-05 | Alert rules active for funnel regressions |

## Acceptance Criteria
- Public website supports complete purchase journey without dead-end state.
- Pricing and checkout intent is measurable with end-to-end funnel events.
- Subscription lifecycle states are explicit and self-serve where applicable.
- TR/EN content is consistent and no key-fallback text appears in UI.
- Release quality includes SEO, performance, accessibility, and test coverage.

## Risks to Track
- Stripe ownership model ambiguity (team-level vs platform-level) can block funnel.
- Translation drift between product copy and marketing copy.
- SSR/CSR inconsistency on public pages causing flicker and lower conversion.

## Suggested Execution Order
1. Sprint 1 first, no overlaps skipped.
2. Start Sprint 2 only after S1-06 decision is signed.
3. Gate launch on Sprint 3 acceptance criteria.
