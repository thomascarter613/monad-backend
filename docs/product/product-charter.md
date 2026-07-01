# Product Charter

## Product name

Working name: **Open Backend Cloud**.

This is a temporary project name. It may be replaced later with a unique product name that avoids confusion with Supabase or any other existing product.

## One-sentence description

Open Backend Cloud is a FOSS control plane that turns self-hosted Supabase OSS into a production-grade, Supabase Cloud-like backend platform on user-owned infrastructure.

## Mission

Make it practical for developers, startups, agencies, internal platform teams, and privacy-conscious organizations to run a serious Supabase-based backend platform without relying on Supabase Cloud as the operational control plane.

## Problem

Supabase OSS provides a strong backend runtime. However, self-hosted Supabase by itself does not provide the full managed-platform experience of Supabase Cloud.

Teams that self-host still need to solve:

- project and environment management;
- runtime provisioning;
- configuration as code;
- secret management;
- backups, restore, and point-in-time recovery strategy;
- preview environments and branching workflow;
- observability;
- deployment orchestration;
- migration safety;
- audit logs;
- security gates;
- policy enforcement;
- team access control;
- usage and quota tracking;
- disaster recovery;
- production runbooks.

Without this platform layer, self-hosting becomes a collection of manual scripts, dashboard settings, ad hoc infrastructure, and operator memory.

## Opportunity

A high-quality FOSS control plane around Supabase OSS can provide much of the experience developers value in Supabase Cloud while preserving self-hosting, auditability, infrastructure ownership, customization, and open-source composability.

The opportunity is not to clone Supabase Cloud internally. The opportunity is to provide **functional parity for the operational and developer workflows that matter most** using free/open-source tools.

## Target users

Primary v1 users:

- solo developers building serious products;
- technical founders who want self-hosted infrastructure;
- agencies managing multiple client backends;
- startups that want Supabase-like speed without full platform lock-in;
- internal platform teams standardizing self-hosted backend environments.

Later users:

- regulated organizations;
- privacy-conscious companies;
- multi-team engineering organizations;
- education/lab environments;
- FOSS infrastructure communities.

## Product principles

### 1. Supabase-first, not Supabase-fork-first

The platform should use Supabase OSS as the runtime plane and avoid unnecessary forks.

### 2. Control plane separation

The platform's own state, APIs, audit logs, secrets metadata, deployment records, and management workflows should live outside managed customer/runtime databases.

### 3. Production operations are product features

Backups, restores, migrations, logs, metrics, secrets, audit logs, and upgrade workflows are first-class product features, not afterthoughts.

### 4. FOSS-first by default

Core dependencies should be free/open-source wherever practical. Source-available dependencies require explicit review and documentation before being accepted as core dependencies.

### 5. Git and database as sources of truth

Declarative configuration should live in Git. Runtime state and history should live in the control-plane database. Secrets should live in a proper secrets manager.

### 6. Reliability before convenience

The system should favor reliable, explainable, recoverable operations over magical abstractions.

### 7. Human-operable first, automated later

Every automated operation should have a comprehensible manual equivalent and a runbook.

## Runtime/control-plane split

```text
Supabase OSS runtime plane:
  PostgreSQL
  Auth
  PostgREST
  Realtime
  Storage
  Edge Functions
  Studio

Open Backend Cloud control plane:
  organizations
  projects
  environments
  runtime provisioning
  deployments
  migrations
  secrets metadata
  backups/restores
  observability targets
  audit events
  usage/quotas
  team/RBAC
  management API
  CLI
  admin console
```

## v1 promise

v1 should let an operator create, manage, observe, back up, restore, and govern Supabase OSS environments from a reproducible open-source platform.

A v1 user should be able to say:

> I can create a Supabase-backed project, provision environments, apply migrations safely, observe health, manage secrets, run backups, restore from backups, audit privileged actions, and create preview environments without relying on Supabase Cloud as my control plane.

## v1 non-promise

v1 will not promise full Supabase Cloud parity.

It will not initially provide:

- global multi-region orchestration;
- fully managed database scaling tiers;
- zero-copy branching;
- enterprise marketplace;
- sophisticated billing engine;
- automatic infrastructure optimization;
- complete autoscaling policy abstraction;
- production-grade hosted SaaS offering.

## Success criteria

The project is succeeding when:

1. a clean checkout can run the local development stack;
2. Supabase runtime configuration is reproducible;
3. the control-plane model can represent organizations, projects, and environments;
4. a runtime can be provisioned from templates;
5. backups and restores work and are verified;
6. logs, metrics, health checks, and alerts are visible;
7. migrations and RLS policies are tested;
8. privileged actions produce audit events;
9. the platform can be operated through API and CLI;
10. an admin console can manage core workflows;
11. preview environments can be created and destroyed;
12. documentation allows a new contributor to understand and operate the platform.

## References

- Supabase overview: https://supabase.com/
- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- Supabase local development: https://supabase.com/docs/guides/local-development/overview
