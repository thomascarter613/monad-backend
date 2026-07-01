export type PlatformEventName =
  | "project.created"
  | "environment.created"
  | "runtime.started"
  | "runtime.stopped"
  | "migration.applied"
  | "backup.created"
  | "restore.started"
  | "audit.recorded";

export interface PlatformEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly name: PlatformEventName;
  readonly occurredAt: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly environmentId?: string;
  readonly payload: TPayload;
}
