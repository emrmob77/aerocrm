# SSR + Realtime Standardization Plan

## Objective
- Remove first-load data lag and UI flicker.
- Make dashboard pages render with SSR initial payload.
- Keep data live with Supabase realtime channels (without manual refresh).

## Standard (Target Pattern)
1. `page.tsx` is server component (`force-dynamic` when needed).
2. Server fetches initial payload and user/team context.
3. Render `*PageClient` with initial props.
4. Client component:
   - initializes state from SSR props
   - skips redundant first fetch for same user/team
   - subscribes to realtime channels (`INSERT/UPDATE/DELETE`)
   - applies optimistic updates for mutations

## Completed
- `/app/(dashboard)/layout.tsx` + `/components/layout/*`:
  SSR initial user hydration, reduced role/name flicker.
- `/app/(dashboard)/deals/page.tsx` + `/components/deals/DealsBoard.tsx`:
  SSR members/owners + realtime consistency.
- `/app/(dashboard)/deals/[id]/page.tsx` + `/app/(dashboard)/deals/[id]/DealDetailsClient.tsx`:
  SSR owner/members + realtime deal/proposals/activities.
- `/app/(dashboard)/products/page.tsx` + `/app/(dashboard)/products/ProductsPageClient.tsx`:
  SSR initial products + realtime products stream.
- `/app/(dashboard)/notifications/page.tsx` + `/app/(dashboard)/notifications/NotificationsPageClient.tsx`:
  SSR initial notifications + realtime notification stream.
- `/app/(dashboard)/settings/team/page.tsx` + `/app/(dashboard)/settings/team/TeamSettingsPageClient.tsx`:
  SSR initial members/invites/deals + realtime team row refresh.
- `/app/(dashboard)/reports/page.tsx` + `/app/(dashboard)/reports/ReportsPageClient.tsx`:
  SSR initial report summary + live DB-backed report filters via `/api/reports/summary`.

## Remaining CSR Pages (Current)
- `/app/(dashboard)/deals/new/page.tsx`
- `/app/(dashboard)/integrations/stripe/page.tsx`
- `/app/(dashboard)/integrations/twilio/page.tsx`
- `/app/(dashboard)/proposals/[id]/page.tsx`
- `/app/(dashboard)/proposals/new/page.tsx`
- `/app/(dashboard)/reports/import-export/page.tsx`
- `/app/(dashboard)/search/page.tsx`
- `/app/(dashboard)/settings/billing/page.tsx`
- `/app/(dashboard)/settings/developer/page.tsx`
- `/app/(dashboard)/settings/monitoring/page.tsx`
- `/app/(dashboard)/settings/notifications/page.tsx`
- `/app/(dashboard)/settings/page.tsx`
- `/app/(dashboard)/settings/profile/page.tsx`
- `/app/(dashboard)/settings/security/page.tsx`
- `/app/(dashboard)/templates/[id]/page.tsx`
- `/app/(dashboard)/templates/new/page.tsx`
- `/app/(dashboard)/templates/page.tsx`
- `/app/(dashboard)/webhooks/logs/page.tsx`
- `/app/(dashboard)/webhooks/page.tsx`

## Execution Order

### Phase 1 (High Impact Data Pages)
- `/app/(dashboard)/search/page.tsx`
- `/app/(dashboard)/templates/page.tsx`
- `/app/(dashboard)/webhooks/page.tsx`
- `/app/(dashboard)/webhooks/logs/page.tsx`
- `/app/(dashboard)/reports/import-export/page.tsx`

### Phase 2 (Settings Data Pages)
- `/app/(dashboard)/settings/monitoring/page.tsx`
- `/app/(dashboard)/settings/notifications/page.tsx`
- `/app/(dashboard)/settings/billing/page.tsx`
- `/app/(dashboard)/settings/profile/page.tsx`

### Phase 3 (Editor / Detail Data Pages)
- `/app/(dashboard)/proposals/new/page.tsx`
- `/app/(dashboard)/templates/[id]/page.tsx`
- `/app/(dashboard)/integrations/stripe/page.tsx`
- `/app/(dashboard)/integrations/twilio/page.tsx`

### Phase 4 (Low Data / Static-like Pages)
- `/app/(dashboard)/settings/page.tsx`
- `/app/(dashboard)/settings/developer/page.tsx`
- `/app/(dashboard)/settings/security/page.tsx`
- `/app/(dashboard)/templates/new/page.tsx`
- `/app/(dashboard)/deals/new/page.tsx`
- `/app/(dashboard)/proposals/[id]/page.tsx`

## Acceptance Criteria Per Page
- No “empty/fallback then real value” flicker on first load.
- First meaningful data visible from SSR response.
- Realtime updates reflect within same session without refresh.
- `npm run lint` clean except known pre-existing warnings.
