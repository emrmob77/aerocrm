-- Sistem sagligi ve monitoring tablolari

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  team_id uuid references public.teams(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  level text not null,
  message text not null,
  source text,
  context jsonb
);

create index if not exists system_logs_team_id_idx on public.system_logs (team_id);
create index if not exists system_logs_created_at_idx on public.system_logs (created_at);
create index if not exists system_logs_level_idx on public.system_logs (level);

alter table public.system_logs enable row level security;

drop policy if exists "Team members can view system logs" on public.system_logs;
create policy "Team members can view system logs"
  on public.system_logs for select
  using (team_id in (select team_id from public.users where id = auth.uid()));

drop policy if exists "Team members can insert system logs" on public.system_logs;
create policy "Team members can insert system logs"
  on public.system_logs for insert
  with check (
    auth.uid() is not null
    and (
      team_id is null
      or team_id in (select team_id from public.users where id = auth.uid())
    )
  );

create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  team_id uuid references public.teams(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  path text not null,
  method text not null,
  status integer,
  duration_ms integer,
  user_agent text,
  ip_address text
);

create index if not exists api_usage_logs_team_id_idx on public.api_usage_logs (team_id);
create index if not exists api_usage_logs_created_at_idx on public.api_usage_logs (created_at);
create index if not exists api_usage_logs_path_idx on public.api_usage_logs (path);

alter table public.api_usage_logs enable row level security;

drop policy if exists "Team members can view api usage" on public.api_usage_logs;
create policy "Team members can view api usage"
  on public.api_usage_logs for select
  using (team_id in (select team_id from public.users where id = auth.uid()));

drop policy if exists "Team members can insert api usage" on public.api_usage_logs;
create policy "Team members can insert api usage"
  on public.api_usage_logs for insert
  with check (
    auth.uid() is not null
    and (
      team_id is null
      or team_id in (select team_id from public.users where id = auth.uid())
    )
  );
