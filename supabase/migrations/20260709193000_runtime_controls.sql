create table if not exists public.runtime_controls (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.runtime_controls (key, value)
values (
  'server_control',
  jsonb_build_object(
    'enabled', true,
    'message', 'Сайт временно не работает'
  )
)
on conflict (key) do nothing;

alter table public.runtime_controls enable row level security;

revoke all on public.runtime_controls from anon, authenticated;

drop trigger if exists trg_runtime_controls_updated_at on public.runtime_controls;
create trigger trg_runtime_controls_updated_at
  before update on public.runtime_controls
  for each row execute function public.set_updated_at();
