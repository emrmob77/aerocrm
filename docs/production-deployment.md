# Production Deployment Runbook

## 1) Vercel setup
- Import repository into Vercel.
- Use `npm ci` as install command and `npm run build` as build command.
- Keep framework preset as `Next.js`.
- `vercel.json` in project root already defines security headers and function timeout for Stripe webhook.

## 2) Environment variables
- Copy keys from `.env.production.example` to Vercel Project Settings -> Environment Variables.
- Set values for all environments (`Production`, optionally `Preview`).
- Minimum required:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs)

## 3) Domain and SSL
- Add custom domain under Vercel Project -> Domains.
- Point DNS (A/CNAME) to Vercel as instructed by Vercel UI.
- SSL is auto-provisioned by Vercel. Verify HTTPS redirect is enabled.

## 4) Stripe webhook
- In Stripe Dashboard -> Developers -> Webhooks add:
  - `https://your-domain.com/api/stripe/webhook`
- Subscribe to events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `invoice.payment_action_required`
  - `customer.subscription.trial_will_end`
- Copy signing secret into `STRIPE_WEBHOOK_SECRET`.

## 5) Monitoring and logging
- API usage and error logs are stored in:
  - `api_usage_logs`
  - `system_logs`
- Monitoring dashboard:
  - `/settings/monitoring`
- Optional: integrate external alerting (Sentry/Datadog) using webhook or periodic SQL checks.

## 6) Backup strategy
- Daily DB backup:
  - `SUPABASE_DB_URL=... ./scripts/backup-supabase.sh`
- Store backup artifacts outside app host (S3/Blob bucket).
- Keep at least:
  - Daily backups for 14 days
  - Weekly backups for 8 weeks
  - Monthly backups for 6 months
- Test restore quarterly on a staging project.

## 7) Release checklist
- `npm run type-check`
- `npm run test:property`
- `npm run test -- --run`
- `npm run test:e2e`
- Optional perf audit: `npm run test:lighthouse`
