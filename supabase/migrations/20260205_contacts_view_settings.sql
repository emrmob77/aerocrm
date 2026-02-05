-- User-specific view settings (contacts, etc.)

create table if not exists public.user_view_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  context text not null,
  settings jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, context)
);

create index if not exists idx_user_view_settings_user_id on public.user_view_settings (user_id);
create index if not exists idx_user_view_settings_context on public.user_view_settings (context);

alter table public.user_view_settings enable row level security;

-- Users can view their own settings
create policy "Users can view their view settings"
  on public.user_view_settings for select
  using (user_id = auth.uid());

-- Users can manage their own settings
create policy "Users can manage their view settings"
  on public.user_view_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at trigger
create or replace function update_user_view_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'user_view_settings_updated_at'
  ) then
    create trigger user_view_settings_updated_at
      before update on public.user_view_settings
      for each row
      execute function update_user_view_settings_updated_at();
  end if;
end
$$;
