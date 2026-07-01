export const CONTROL_PLANE_SCHEMA = "platform" as const;

export const CONTROL_PLANE_TABLES = [
  "organizations",
  "organization_memberships",
  "projects",
  "project_environments",
  "runtime_instances",
  "runtime_services",
  "deployments",
  "deployment_events",
  "secrets",
  "secret_versions",
  "backup_plans",
  "backups",
  "restore_jobs",
  "audit_events",
  "usage_events",
  "quota_limits",
  "api_keys",
  "webhooks",
] as const;

export type ControlPlaneTableName = (typeof CONTROL_PLANE_TABLES)[number];

export const ENVIRONMENT_KINDS = ["local", "dev", "staging", "production", "preview"] as const;
export type EnvironmentKind = (typeof ENVIRONMENT_KINDS)[number];

export const ENVIRONMENT_STATUSES = [
  "registered",
  "provisioning",
  "healthy",
  "degraded",
  "failed",
  "suspended",
  "destroyed",
] as const;
export type EnvironmentStatus = (typeof ENVIRONMENT_STATUSES)[number];

export const RUNTIME_STATUSES = [
  "requested",
  "rendered",
  "starting",
  "healthy",
  "degraded",
  "stopped",
  "failed",
  "destroyed",
] as const;
export type RuntimeStatus = (typeof RUNTIME_STATUSES)[number];

export const DEPLOYMENT_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
  "rolled_back",
] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const BACKUP_STATUSES = [
  "scheduled",
  "running",
  "succeeded",
  "failed",
  "expired",
  "deleted",
] as const;
export type BackupStatus = (typeof BACKUP_STATUSES)[number];

export const RESTORE_STATUSES = ["queued", "running", "succeeded", "failed", "canceled"] as const;
export type RestoreStatus = (typeof RESTORE_STATUSES)[number];

export const SECRET_PROVIDERS = [
  "sops_age",
  "openbao",
  "external_secrets",
  "environment",
  "manual",
] as const;
export type SecretProvider = (typeof SECRET_PROVIDERS)[number];

export const AUDIT_ACTOR_TYPES = [
  "user",
  "service_account",
  "api_key",
  "system",
  "automation",
] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export interface TimestampedRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface OrganizationRecord extends TimestampedRecord {
  readonly slug: string;
  readonly name: string;
  readonly displayName?: string;
  readonly status: "active" | "suspended" | "archived";
  readonly metadata: Record<string, unknown>;
}

export interface ProjectRecord extends TimestampedRecord {
  readonly organizationId: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly defaultRegion: string;
  readonly repositoryUrl?: string;
  readonly status: "active" | "suspended" | "archived";
  readonly metadata: Record<string, unknown>;
}

export interface ProjectEnvironmentRecord extends TimestampedRecord {
  readonly projectId: string;
  readonly name: string;
  readonly slug: string;
  readonly kind: EnvironmentKind;
  readonly status: EnvironmentStatus;
  readonly region: string;
  readonly runtimeUrl?: string;
  readonly apiUrl?: string;
  readonly studioUrl?: string;
  readonly branchName?: string;
  readonly pullRequestUrl?: string;
  readonly expiresAt?: string;
  readonly metadata: Record<string, unknown>;
}

export interface RuntimeInstanceRecord extends TimestampedRecord {
  readonly environmentId: string;
  readonly runtimeKind: "supabase-oss";
  readonly status: RuntimeStatus;
  readonly version?: string;
  readonly manifestRef?: string;
  readonly composeProjectName?: string;
  readonly kubernetesNamespace?: string;
  readonly healthUrl?: string;
  readonly lastHealthCheckAt?: string;
  readonly metadata: Record<string, unknown>;
}

export interface DeploymentRecord extends TimestampedRecord {
  readonly environmentId: string;
  readonly status: DeploymentStatus;
  readonly sourceType: "git" | "cli" | "api" | "system";
  readonly sourceRef?: string;
  readonly commitSha?: string;
  readonly migrationVersion?: string;
  readonly requestedBy?: string;
  readonly metadata: Record<string, unknown>;
}

export interface BackupRecord {
  readonly id: string;
  readonly environmentId: string;
  readonly backupPlanId?: string;
  readonly status: BackupStatus;
  readonly backupKind: "full" | "incremental" | "differential" | "wal" | "logical";
  readonly artifactUri?: string;
  readonly sizeBytes?: number;
  readonly checksum?: string;
  readonly createdAt: string;
}

export interface RestoreJobRecord {
  readonly id: string;
  readonly backupId?: string;
  readonly sourceEnvironmentId?: string;
  readonly targetEnvironmentId: string;
  readonly status: RestoreStatus;
  readonly restoreMode: "new_environment" | "overwrite_existing" | "point_in_time";
  readonly requestedBy?: string;
  readonly requestedAt: string;
  readonly targetTimestamp?: string;
}

export interface SecretReferenceRecord extends TimestampedRecord {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly environmentId?: string;
  readonly name: string;
  readonly provider: SecretProvider;
  readonly externalRef: string;
  readonly classification: "internal" | "secret" | "restricted";
  readonly description?: string;
}

export interface AuditEventRecord {
  readonly id: string;
  readonly occurredAt: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly environmentId?: string;
  readonly actorType: AuditActorType;
  readonly actorId?: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly requestId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly metadata: Record<string, unknown>;
}
