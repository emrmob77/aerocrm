create table if not exists public.proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists proposal_versions_proposal_id_idx on public.proposal_versions (proposal_id);
create index if not exists proposal_versions_team_id_created_at_idx on public.proposal_versions (team_id, created_at desc);
create index if not exists proposal_versions_user_id_created_at_idx on public.proposal_versions (user_id, created_at desc);

alter table public.proposal_versions enable row level security;

drop policy if exists "Team members manage proposal versions" on public.proposal_versions;
create policy "Team members manage proposal versions" on public.proposal_versions
for all
using (
  team_id = (select team_id from public.users where id = auth.uid())
)
with check (
  team_id = (select team_id from public.users where id = auth.uid())
);
