create schema if not exists platform;

create extension if not exists pgcrypto;

create table if not exists platform.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default array['management:*']::text[],
  status text not null default 'active',
  expires_at timestamptz null,
  last_used_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table platform.api_keys
  add column if not exists organization_id uuid null,
  add column if not exists name text,
  add column if not exists key_prefix text,
  add column if not exists key_hash text,
  add column if not exists scopes text[] not null default array['management:*']::text[],
  add column if not exists status text not null default 'active',
  add column if not exists expires_at timestamptz null,
  add column if not exists last_used_at timestamptz null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update platform.api_keys
set
  name = coalesce(name, 'unnamed-api-key'),
  key_prefix = coalesce(key_prefix, 'unknown'),
  key_hash = coalesce(key_hash, encode(gen_random_bytes(32), 'hex')),
  status = coalesce(status, 'active'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  name is null
  or key_prefix is null
  or key_hash is null
  or status is null
  or created_at is null
  or updated_at is null;

alter table platform.api_keys
  alter column name set not null,
  alter column key_prefix set not null,
  alter column key_hash set not null,
  alter column status set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'platform'
      and table_name = 'organizations'
  ) then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'api_keys_organization_id_fkey'
    ) then
      alter table platform.api_keys
        add constraint api_keys_organization_id_fkey
        foreign key (organization_id)
        references platform.organizations(id)
        on delete cascade;
    end if;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'api_keys_status_check'
  ) then
    alter table platform.api_keys
      add constraint api_keys_status_check
      check (status in ('active', 'disabled', 'revoked'));
  end if;
end $$;

create unique index if not exists api_keys_key_hash_unique
  on platform.api_keys (key_hash);

create index if not exists api_keys_organization_id_idx
  on platform.api_keys (organization_id);

create index if not exists api_keys_status_idx
  on platform.api_keys (status);

create index if not exists api_keys_key_prefix_idx
  on platform.api_keys (key_prefix);
