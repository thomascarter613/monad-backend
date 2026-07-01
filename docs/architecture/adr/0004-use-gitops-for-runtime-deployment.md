# ADR-0004: Use GitOps for Runtime Deployment

## Status

Accepted

## Date

2026-07-01

## Context

The platform needs reproducible deployment workflows for Supabase runtime instances and control-plane services.

Manual deployment commands and dashboard-only configuration do not provide enough auditability, repeatability, rollback capability, or drift control for a serious backend platform.

A GitOps-first approach makes desired state reviewable, versioned, auditable, and reconcilable.

## Decision

Use a **GitOps-first deployment model** for production-capable runtime and platform deployments.

Local development may use Docker Compose and scripts. Production-capable deployments should move toward declarative manifests, OpenTofu-managed infrastructure, and Argo CD-style reconciliation.

## Consequences

### Positive

- Desired state is versioned in Git.
- Infrastructure and runtime changes can be reviewed before deployment.
- Rollbacks are easier to reason about.
- Drift can be detected and corrected.
- Deployment history can be tied to commits and audit events.
- Works well with CI validation gates.

### Negative

- GitOps adds operational complexity compared with simple scripts.
- Not every runtime action maps perfectly to declarative state.
- Secrets require careful integration with secret managers.
- Emergency operations need documented break-glass workflows.

### Risks

- Git may be mistaken as the place for raw secrets.
- Generated manifests can drift if generation is not deterministic.
- Operators may bypass GitOps unless the workflow is convenient.

## Deployment model

Target flow:

```text
Git change
  -> CI validation
  -> security/policy checks
  -> manifest/config generation
  -> GitOps reconciliation
  -> runtime health checks
  -> deployment status recorded
  -> audit event recorded
```

## Local vs production

### Local/dev

Use:

```text
Docker Compose
Supabase CLI
local scripts
SOPS/age where useful
```

### Production-capable

Use:

```text
OpenTofu
Kubernetes or k3s
Argo CD
External Secrets Operator
OpenBao/SOPS
Caddy or Kong
Prometheus/Grafana/Loki
pgBackRest/WAL-G
```

## Alternatives considered

### Manual deployment scripts only

Rejected as the long-term model because they are difficult to audit and reconcile.

### Dashboard-driven deployment

Rejected as the primary model because it hides desired state and makes repeatability harder.

### Full custom orchestrator from day one

Rejected because existing FOSS tools already solve much of the deployment reconciliation problem.

## Follow-up actions

- Start with Docker Compose for WP-0002.
- Keep runtime templates deterministic.
- Add Kubernetes/GitOps manifests in later work packets.
- Add deployment event records to the control-plane database.
- Add policy checks for production deployments.
- Add rollback and break-glass runbooks.
