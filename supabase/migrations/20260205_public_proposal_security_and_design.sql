alter table if exists public.proposals
  add column if not exists design_settings jsonb not null default
    '{"background":"#ffffff","text":"#0d121c","accent":"#377DF6","radius":12,"fontScale":100}'::jsonb;

alter table if exists public.proposal_versions
  add column if not exists design_settings jsonb not null default
    '{"background":"#ffffff","text":"#0d121c","accent":"#377DF6","radius":12,"fontScale":100}'::jsonb;

update public.proposals
set design_settings =
  '{"background":"#ffffff","text":"#0d121c","accent":"#377DF6","radius":12,"fontScale":100}'::jsonb
where design_settings is null;

do $$
begin
  if to_regclass('public.proposal_versions') is not null then
    execute '
      update public.proposal_versions
      set design_settings =
        ''{"background":"#ffffff","text":"#0d121c","accent":"#377DF6","radius":12,"fontScale":100}''::jsonb
      where design_settings is null
    ';
  end if;
end $$;

alter table if exists public.proposals enable row level security;
alter table if exists public.proposal_views enable row level security;

drop policy if exists "Public read proposals" on public.proposals;
create policy "Public read proposals" on public.proposals
for select to anon, authenticated
using (public_url is not null and public_url like '%/p/%');

drop policy if exists "Public update proposals" on public.proposals;
create policy "Public update proposals" on public.proposals
for update to anon, authenticated
using (public_url is not null and public_url like '%/p/%')
with check (public_url is not null and public_url like '%/p/%');

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
  )
);
