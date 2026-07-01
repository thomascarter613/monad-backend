export const CONTROL_PLANE_EVENT_NAMES = [
  "organization.created",
  "organization.member_added",
  "project.created",
  "environment.created",
  "environment.provision_requested",
  "environment.provisioned",
  "runtime.started",
  "runtime.stopped",
  "runtime.health_checked",
  "deployment.queued",
  "deployment.started",
  "deployment.succeeded",
  "deployment.failed",
  "migration.applied",
  "secret.created",
  "secret.rotated",
  "backup.plan_created",
  "backup.started",
  "backup.succeeded",
  "backup.failed",
  "restore.started",
  "restore.succeeded",
  "restore.failed",
  "quota.exceeded",
  "webhook.created",
  "audit.recorded",
] as const;

export type PlatformEventName = (typeof CONTROL_PLANE_EVENT_NAMES)[number];

export interface PlatformEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly name: PlatformEventName;
  readonly occurredAt: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly environmentId?: string;
  readonly actorId?: string;
  readonly requestId?: string;
  readonly payload: TPayload;
}

export interface AuditEventPayload {
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly actorType: "user" | "service_account" | "api_key" | "system" | "automation";
  readonly metadata?: Record<string, unknown>;
}
