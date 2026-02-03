-- Kullanici dil tercihi
alter table public.users
  add column if not exists language text default 'tr';

create index if not exists users_language_idx on public.users (language);
