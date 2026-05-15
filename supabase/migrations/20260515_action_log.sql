-- Migration: task_action_logs
-- Applica con: supabase db push  oppure incolla nel SQL Editor di Supabase.

create table if not exists public.task_action_logs (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references public.tasks(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  action_type    text not null check (action_type in (
                   'component', 'manual_procedure', 'metadata', 'deploy', 'config'
                 )),
  technology     text not null default 'generic',
  metadata_type  text not null,
  change_status  text not null default 'new' check (change_status in ('new', 'modified', 'deleted')),
  title          text not null,
  description    text,
  component_ref  text,
  created_at     timestamptz not null default now()
);

-- Indice per query per task
create index if not exists idx_task_action_logs_task_id
  on public.task_action_logs (task_id);

-- Indice per storico cross-task per componente
create index if not exists idx_task_action_logs_component_ref
  on public.task_action_logs (component_ref)
  where component_ref is not null;

-- RLS
alter table public.task_action_logs enable row level security;

create policy "owner_all" on public.task_action_logs
  for all
  using (
    task_id in (
      select id from public.tasks where user_id = auth.uid()
    )
  )
  with check (
    task_id in (
      select id from public.tasks where user_id = auth.uid()
    )
  );
