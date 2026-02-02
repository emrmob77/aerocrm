-- Deal files table (matches live schema)
create table if not exists public.deal_files (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_size integer,
  mime_type text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists deal_files_deal_id_idx on public.deal_files (deal_id);
create index if not exists deal_files_uploaded_by_idx on public.deal_files (uploaded_by);

alter table public.deal_files enable row level security;

drop policy if exists "Team members manage deal files" on public.deal_files;
create policy "Team members manage deal files" on public.deal_files
for all
using (
  exists (
    select 1
    from public.deals d
    where d.id = deal_files.deal_id
      and (
        (d.team_id is not null and d.team_id = (select team_id from public.users where id = auth.uid()))
        or (d.team_id is null and d.user_id = auth.uid())
      )
  )
)
with check (
  exists (
    select 1
    from public.deals d
    where d.id = deal_files.deal_id
      and (
        (d.team_id is not null and d.team_id = (select team_id from public.users where id = auth.uid()))
        or (d.team_id is null and d.user_id = auth.uid())
      )
  )
);

-- Storage bucket for deal files
insert into storage.buckets (id, name, public)
values ('deal-files', 'deal-files', true)
on conflict (id) do nothing;

-- Storage RLS policies for deal files
alter table storage.objects enable row level security;

drop policy if exists "Deal files read" on storage.objects;
create policy "Deal files read" on storage.objects
for select
using (bucket_id = 'deal-files' and auth.role() = 'authenticated');

drop policy if exists "Deal files insert" on storage.objects;
create policy "Deal files insert" on storage.objects
for insert
with check (bucket_id = 'deal-files' and auth.role() = 'authenticated');

drop policy if exists "Deal files delete" on storage.objects;
create policy "Deal files delete" on storage.objects
for delete
using (bucket_id = 'deal-files' and auth.role() = 'authenticated');
