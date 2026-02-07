alter table if exists public.proposals
  add column if not exists deleted_at timestamptz;

create index if not exists proposals_team_deleted_created_at_idx
  on public.proposals (team_id, deleted_at, created_at desc);

create index if not exists proposals_deleted_at_idx
  on public.proposals (deleted_at);

-- Keep deleted proposals inaccessible from public proposal links.
drop policy if exists "Public read proposals" on public.proposals;
create policy "Public read proposals" on public.proposals
for select to anon, authenticated
using (
  public_url is not null
  and public_url like '%/p/%'
  and deleted_at is null
);

drop policy if exists "Public update proposals" on public.proposals;
create policy "Public update proposals" on public.proposals
for update to anon, authenticated
using (
  public_url is not null
  and public_url like '%/p/%'
  and deleted_at is null
)
with check (
  public_url is not null
  and public_url like '%/p/%'
  and deleted_at is null
);

-- Proposal views should only be insertable for active public proposals.
drop policy if exists "Public insert proposal views" on public.proposal_views;
create policy "Public insert proposal views" on public.proposal_views
for insert to anon, authenticated
with check (
  exists (
    select 1
    from public.proposals p
    where p.id = proposal_id
      and p.public_url is not null
      and p.public_url like '%/p/%'
      and p.deleted_at is null
  )
);
