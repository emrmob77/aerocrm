-- Database performance indexes for critical CRM queries
create extension if not exists pg_trgm;

-- Proposals
create index if not exists proposals_team_status_created_at_idx
  on public.proposals (team_id, status, created_at desc);

create index if not exists proposals_team_updated_at_idx
  on public.proposals (team_id, updated_at desc);

create index if not exists proposals_contact_id_idx
  on public.proposals (contact_id);

create index if not exists proposals_deal_id_idx
  on public.proposals (deal_id);

create index if not exists proposals_expires_at_idx
  on public.proposals (expires_at);

create index if not exists proposals_signed_at_idx
  on public.proposals (signed_at);

create index if not exists proposals_public_url_trgm_idx
  on public.proposals using gin (public_url gin_trgm_ops);

-- Notifications
create index if not exists notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_read_created_at_idx
  on public.notifications (user_id, read, created_at desc);

-- Deals
create index if not exists deals_team_stage_updated_at_idx
  on public.deals (team_id, stage, updated_at desc);

create index if not exists deals_team_created_at_idx
  on public.deals (team_id, created_at desc);

create index if not exists deals_contact_id_idx
  on public.deals (contact_id);

-- Contacts
create index if not exists contacts_team_created_at_idx
  on public.contacts (team_id, created_at desc);

create index if not exists contacts_team_full_name_idx
  on public.contacts (team_id, full_name);

create index if not exists contacts_team_email_idx
  on public.contacts (team_id, email);

-- Public tracking
create index if not exists proposal_views_proposal_created_at_idx
  on public.proposal_views (proposal_id, created_at desc);
