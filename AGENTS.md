# AGENTS.md

This repository is being built through work packets. Every change should keep
the source-of-truth docs, architecture decisions, scripts, and acceptance
criteria aligned.

## Product thesis

Open Backend Cloud is a FOSS Supabase Cloud-like control plane around
Supabase OSS.

Supabase OSS is the runtime plane. This repository provides the platform
control plane around it.

## Current work packet state

Implemented:

- WP-0001: Repository Foundation and Product Charter
- WP-0002: Monorepo Tooling and Local Supabase Runtime
- WP-0003: Control-Plane Data Model and Database Package

Next:

- WP-0004: Control API Skeleton and Platform Service Boundaries

## Non-negotiable architecture rules

1. Do not replace Supabase OSS unnecessarily.
2. Treat Supabase OSS as the runtime plane.
3. Treat Open Backend Cloud as the control plane.
4. Keep control-plane state separate from customer runtime data.
5. Prefer FOSS, self-hostable, production-capable tools.
6. Make platform actions observable, auditable, and testable.
7. Do not store raw secrets in the control-plane database.
8. Use Postgres as the control-plane source of truth.
9. Use GitOps-compatible deployment concepts.
10. Preserve clear work-packet acceptance criteria.

## Local commands

```bash
bun install
bun run check
bun run control-plane:check
bun run supabase:start
bun run supabase:reset
bun run supabase:test
bun run supabase:types
```

## Coding expectations

- Keep TypeScript strict.
- Export shared types from package `src/index.ts` files.
- Keep database-facing names distinct from domain-facing names.
- Add docs for new architectural decisions.
- Add validation scripts for critical generated or schema artifacts.
- Keep Markdown links valid.

## Control-plane database rule

The `platform` schema in local Supabase exists for development speed. In
production, control-plane state belongs in a dedicated Postgres database,
operationally isolated from customer Supabase runtime databases.
