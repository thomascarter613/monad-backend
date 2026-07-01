# ADR-0001: Use Supabase OSS as Runtime Plane

## Status

Accepted

## Date

2026-07-01

## Context

The project aims to provide a FOSS Supabase Cloud-like backend platform. Supabase OSS already provides a strong backend runtime built around PostgreSQL, Auth, generated APIs, Realtime, Storage, Edge Functions, Studio, local development, migrations, and related developer tooling.

Self-hosted Supabase is powerful, but it should be treated as the runtime backend stack rather than a full managed cloud platform. The missing capabilities are mainly platform/control-plane capabilities: projects, environments, provisioning, branching, managed backups/PITR, advanced observability, management APIs, secrets, governance, and operational automation.

## Decision

Use **Supabase OSS as the runtime plane**.

Open Backend Cloud will not initially replace or fork Supabase. It will orchestrate and govern Supabase OSS runtime instances.

## Consequences

### Positive

- We inherit a mature Postgres-centered backend runtime.
- We avoid rebuilding Auth, REST APIs, Realtime, Storage, Edge Functions, and Studio from scratch.
- We align with a widely adopted developer experience.
- We can focus on the missing platform layer.
- We preserve compatibility with Supabase local development and migrations where practical.

### Negative

- We depend on upstream Supabase architecture and release behavior.
- We must track Supabase component versions carefully.
- We may need compatibility tests across runtime versions.
- Some Supabase Cloud features may not map cleanly to self-hosted runtime behavior.

### Risks

- Upstream breaking changes could affect provisioning and deployment templates.
- Operators may assume this project provides full Supabase Cloud parity before it does.
- Runtime customization could drift if not managed as code.

## Alternatives considered

### Build a backend platform from raw Postgres and custom services

Rejected for v1 because it would require rebuilding many capabilities Supabase already provides.

### Use Appwrite as the runtime plane

Rejected for this project direction because the desired foundation is Postgres/RLS-first, and Supabase aligns better with that posture.

### Fork Supabase deeply

Rejected for v1 because a deep fork creates maintenance burden and reduces compatibility with upstream.

## Follow-up actions

- Pin Supabase runtime image versions in future implementation work.
- Add compatibility notes for supported Supabase versions.
- Create runtime templates that can be updated deliberately.
- Add health checks and smoke tests for each runtime instance.
- Create upgrade orchestration in a later work packet.

## References

- Supabase overview: https://supabase.com/
- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
