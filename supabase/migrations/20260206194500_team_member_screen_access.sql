alter table public.users
  add column if not exists allowed_screens text[];

comment on column public.users.allowed_screens is
  'Per-user dashboard page visibility list. Null means all pages are allowed.';
