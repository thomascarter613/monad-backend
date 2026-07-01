create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.runtime_metadata (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (length(trim(key)) > 0),
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.runtime_metadata is
  'Local runtime metadata proving that Supabase migrations, seed data, RLS, tests, and type generation are wired.';

comment on column public.runtime_metadata.key is
  'Stable metadata key for the local runtime template.';

comment on column public.runtime_metadata.value is
  'Structured metadata value. Do not store secrets here.';

drop trigger if exists trg_runtime_metadata_set_updated_at on public.runtime_metadata;

create trigger trg_runtime_metadata_set_updated_at
before update on public.runtime_metadata
for each row
execute function public.set_updated_at();

alter table public.runtime_metadata enable row level security;

-- Authenticated users may read runtime metadata. Direct writes are intentionally
-- not granted to anon/authenticated users. Server-side operations should use
-- controlled service-role access through future platform services.
drop policy if exists "Authenticated users can read runtime metadata" on public.runtime_metadata;

create policy "Authenticated users can read runtime metadata"
on public.runtime_metadata
for select
to authenticated
using (true);
