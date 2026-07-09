create table if not exists public.admin_users (
  email text primary key,
  user_id uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.admin_users (email, is_active)
values ('admin@mmt.xyz', true)
on conflict (email) do update
set is_active = excluded.is_active;

alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon, authenticated;

drop trigger if exists trg_admin_users_updated_at on public.admin_users;
create trigger trg_admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

update public.runtime_controls
set value = jsonb_set(
  jsonb_set(
    coalesce(value, '{}'::jsonb),
    '{maintenanceVariant}',
    to_jsonb(coalesce(value->>'maintenanceVariant', 'standard'))
  ),
  '{message}',
  to_jsonb(coalesce(value->>'message', 'Сайт временно не работает'))
)
where key = 'server_control';
