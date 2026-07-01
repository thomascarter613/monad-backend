-- WP-0003: Control-plane data model.
--
-- This migration creates the first platform/control-plane schema used by
-- Open Backend Cloud to manage Supabase OSS runtime environments.
--
-- Production note:
--   In production, this schema belongs in the control-plane Postgres
--   database, not in customer runtime databases. During early local
--   development, the local Supabase Postgres instance is used as a
--   convenient control-plane development database.

create extension if not exists pgcrypto;

create schema if not exists platform;

create type platform.organization_role as enum (
  'owner',
  'admin',
  'developer',
  'viewer',
  'billing_admin',
  'security_admin',
  'ops_admin'
);

create type platform.environment_kind as enum (
  'local',
  'dev',
  'staging',
  'production',
  'preview'
);

create type platform.environment_status as enum (
  'registered',
  'provisioning',
  'healthy',
  'degraded',
  'failed',
  'suspended',
  'destroyed'
);

create type platform.runtime_status as enum (
  'requested',
  'rendered',
  'starting',
  'healthy',
  'degraded',
  'stopped',
  'failed',
  'destroyed'
);

create type platform.runtime_service_status as enum (
  'unknown',
  'starting',
  'healthy',
  'degraded',
  'stopped',
  'failed'
);

create type platform.deployment_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled',
  'rolled_back'
);

create type platform.backup_status as enum (
  'scheduled',
  'running',
  'succeeded',
  'failed',
  'expired',
  'deleted'
);

create type platform.restore_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled'
);

create type platform.secret_provider as enum (
  'sops_age',
  'openbao',
  'external_secrets',
  'environment',
  'manual'
);

create type platform.audit_actor_type as enum (
  'user',
  'service_account',
  'api_key',
  'system',
  'automation'
);

create type platform.webhook_status as enum (
  'enabled',
  'disabled',
  'failing'
);

create type platform.quota_period as enum (
  'minute',
  'hour',
  'day',
  'month',
  'lifetime'
);

create table platform.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_name text,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table platform.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  user_id uuid not null,
  role platform.organization_role not null,
  invited_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table platform.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  default_region text not null default 'local',
  repository_url text,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, slug)
);

create table platform.project_environments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references platform.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  kind platform.environment_kind not null,
  status platform.environment_status not null default 'registered',
  region text not null default 'local',
  runtime_url text,
  api_url text,
  studio_url text,
  database_url_secret_id uuid,
  anon_key_secret_id uuid,
  service_role_key_secret_id uuid,
  branch_name text,
  pull_request_url text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  destroyed_at timestamptz,
  unique (project_id, slug)
);

create table platform.runtime_instances (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references platform.project_environments(id) on delete cascade,
  runtime_kind text not null default 'supabase-oss' check (runtime_kind in ('supabase-oss')),
  status platform.runtime_status not null default 'requested',
  version text,
  manifest_ref text,
  compose_project_name text,
  kubernetes_namespace text,
  health_url text,
  last_health_check_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (environment_id)
);

create table platform.runtime_services (
  id uuid primary key default gen_random_uuid(),
  runtime_instance_id uuid not null references platform.runtime_instances(id) on delete cascade,
  service_name text not null,
  image_ref text,
  status platform.runtime_service_status not null default 'unknown',
  internal_url text,
  public_url text,
  last_health_check_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (runtime_instance_id, service_name)
);

create table platform.deployments (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references platform.project_environments(id) on delete cascade,
  status platform.deployment_status not null default 'queued',
  source_type text not null default 'git' check (source_type in ('git', 'cli', 'api', 'system')),
  source_ref text,
  commit_sha text,
  migration_version text,
  started_at timestamptz,
  completed_at timestamptz,
  requested_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table platform.deployment_events (
  id uuid primary key default gen_random_uuid(),
  deployment_id uuid not null references platform.deployments(id) on delete cascade,
  event_name text not null,
  message text,
  severity text not null default 'info' check (severity in ('debug', 'info', 'warning', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table platform.secrets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid references platform.projects(id) on delete cascade,
  environment_id uuid references platform.project_environments(id) on delete cascade,
  name text not null,
  provider platform.secret_provider not null,
  external_ref text not null,
  classification text not null default 'secret' check (classification in ('internal', 'secret', 'restricted')),
  description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rotated_at timestamptz,
  unique (organization_id, project_id, environment_id, name)
);

alter table platform.project_environments
  add constraint project_environments_database_url_secret_fk
  foreign key (database_url_secret_id) references platform.secrets(id) on delete set null;

alter table platform.project_environments
  add constraint project_environments_anon_key_secret_fk
  foreign key (anon_key_secret_id) references platform.secrets(id) on delete set null;

alter table platform.project_environments
  add constraint project_environments_service_role_key_secret_fk
  foreign key (service_role_key_secret_id) references platform.secrets(id) on delete set null;

create table platform.secret_versions (
  id uuid primary key default gen_random_uuid(),
  secret_id uuid not null references platform.secrets(id) on delete cascade,
  version_label text not null,
  external_version_ref text,
  checksum text,
  created_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (secret_id, version_label)
);

create table platform.backup_plans (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references platform.project_environments(id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  schedule text not null,
  retention_days integer not null default 30 check (retention_days > 0),
  storage_target_ref text not null,
  pitr_enabled boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (environment_id, name)
);

create table platform.backups (
  id uuid primary key default gen_random_uuid(),
  backup_plan_id uuid references platform.backup_plans(id) on delete set null,
  environment_id uuid not null references platform.project_environments(id) on delete cascade,
  status platform.backup_status not null default 'scheduled',
  backup_kind text not null default 'full' check (backup_kind in ('full', 'incremental', 'differential', 'wal', 'logical')),
  artifact_uri text,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table platform.restore_jobs (
  id uuid primary key default gen_random_uuid(),
  backup_id uuid references platform.backups(id) on delete set null,
  source_environment_id uuid references platform.project_environments(id) on delete set null,
  target_environment_id uuid not null references platform.project_environments(id) on delete cascade,
  status platform.restore_status not null default 'queued',
  restore_mode text not null default 'new_environment' check (restore_mode in ('new_environment', 'overwrite_existing', 'point_in_time')),
  requested_by uuid,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  target_timestamp timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table platform.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  organization_id uuid references platform.organizations(id) on delete set null,
  project_id uuid references platform.projects(id) on delete set null,
  environment_id uuid references platform.project_environments(id) on delete set null,
  actor_type platform.audit_actor_type not null,
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  request_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create table platform.usage_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid references platform.projects(id) on delete cascade,
  environment_id uuid references platform.project_environments(id) on delete cascade,
  metric_name text not null,
  quantity numeric not null check (quantity >= 0),
  unit text not null,
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb
);

create table platform.quota_limits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid references platform.projects(id) on delete cascade,
  environment_id uuid references platform.project_environments(id) on delete cascade,
  metric_name text not null,
  limit_quantity numeric not null check (limit_quantity >= 0),
  unit text not null,
  period platform.quota_period not null,
  enforcement_mode text not null default 'warn' check (enforcement_mode in ('off', 'warn', 'block')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id, environment_id, metric_name, period)
);

create table platform.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid references platform.projects(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default array[]::text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (organization_id, key_prefix)
);

create table platform.webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid references platform.projects(id) on delete cascade,
  environment_id uuid references platform.project_environments(id) on delete cascade,
  name text not null,
  url text not null,
  event_filters text[] not null default array[]::text[],
  secret_id uuid references platform.secrets(id) on delete set null,
  status platform.webhook_status not null default 'enabled',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_delivery_at timestamptz,
  unique (organization_id, project_id, environment_id, name)
);

create index organization_memberships_user_id_idx on platform.organization_memberships(user_id);
create index projects_organization_id_idx on platform.projects(organization_id);
create index project_environments_project_id_idx on platform.project_environments(project_id);
create index project_environments_kind_idx on platform.project_environments(kind);
create index runtime_services_runtime_instance_id_idx on platform.runtime_services(runtime_instance_id);
create index deployments_environment_id_created_at_idx on platform.deployments(environment_id, created_at desc);
create index deployment_events_deployment_id_occurred_at_idx on platform.deployment_events(deployment_id, occurred_at desc);
create index secrets_scope_idx on platform.secrets(organization_id, project_id, environment_id);
create index backups_environment_id_created_at_idx on platform.backups(environment_id, created_at desc);
create index restore_jobs_target_environment_id_requested_at_idx on platform.restore_jobs(target_environment_id, requested_at desc);
create index audit_events_organization_id_occurred_at_idx on platform.audit_events(organization_id, occurred_at desc);
create index audit_events_resource_idx on platform.audit_events(resource_type, resource_id);
create index usage_events_metric_time_idx on platform.usage_events(metric_name, occurred_at desc);
create index usage_events_scope_time_idx on platform.usage_events(organization_id, project_id, environment_id, occurred_at desc);
create index api_keys_key_prefix_idx on platform.api_keys(key_prefix);

alter table platform.organizations enable row level security;
alter table platform.organization_memberships enable row level security;
alter table platform.projects enable row level security;
alter table platform.project_environments enable row level security;
alter table platform.runtime_instances enable row level security;
alter table platform.runtime_services enable row level security;
alter table platform.deployments enable row level security;
alter table platform.deployment_events enable row level security;
alter table platform.secrets enable row level security;
alter table platform.secret_versions enable row level security;
alter table platform.backup_plans enable row level security;
alter table platform.backups enable row level security;
alter table platform.restore_jobs enable row level security;
alter table platform.audit_events enable row level security;
alter table platform.usage_events enable row level security;
alter table platform.quota_limits enable row level security;
alter table platform.api_keys enable row level security;
alter table platform.webhooks enable row level security;

comment on schema platform is 'Control-plane schema for Open Backend Cloud platform state.';
comment on table platform.organizations is 'Top-level customer/team boundary for platform ownership.';
comment on table platform.projects is 'Supabase Cloud-like project records managed by the control plane.';
comment on table platform.project_environments is 'Local/dev/staging/production/preview environments for managed projects.';
comment on table platform.runtime_instances is 'Concrete Supabase OSS runtime instance associated with an environment.';
comment on table platform.audit_events is 'Append-only evidence log for privileged platform actions.';
