-- Step notes: per-user, per-step freeform text notes
create table if not exists public.step_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  step_id    uuid not null references public.steps(id) on delete cascade,
  content    text not null default '',
  updated_at timestamptz not null default now(),
  unique(user_id, step_id)
);

alter table public.step_notes enable row level security;

create policy "Users manage own notes"
  on public.step_notes for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists step_notes_user_step_idx on public.step_notes(user_id, step_id);
