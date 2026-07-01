export type OrganizationRole =
  | "owner"
  | "admin"
  | "developer"
  | "viewer"
  | "billing_admin"
  | "security_admin"
  | "ops_admin";

export type EnvironmentKind = "local" | "dev" | "staging" | "production" | "preview";

export type EnvironmentStatus =
  | "registered"
  | "provisioning"
  | "healthy"
  | "degraded"
  | "failed"
  | "suspended"
  | "destroyed";

export interface OrganizationRef {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

export interface OrganizationMembershipRef {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: OrganizationRole;
}

export interface PlatformProjectRef {
  readonly id: string;
  readonly organizationId: string;
  readonly slug: string;
  readonly name: string;
}

export interface RuntimeEnvironmentRef {
  readonly id: string;
  readonly projectId: string;
  readonly kind: EnvironmentKind;
  readonly status: EnvironmentStatus;
  readonly name: string;
  readonly slug: string;
}

export interface RuntimeInstanceRef {
  readonly id: string;
  readonly environmentId: string;
  readonly runtimeKind: "supabase-oss";
  readonly status: string;
  readonly version?: string;
}

export interface DeploymentRef {
  readonly id: string;
  readonly environmentId: string;
  readonly status: string;
  readonly commitSha?: string;
  readonly migrationVersion?: string;
}

export interface BackupRef {
  readonly id: string;
  readonly environmentId: string;
  readonly status: string;
  readonly artifactUri?: string;
}

export interface RestoreJobRef {
  readonly id: string;
  readonly targetEnvironmentId: string;
  readonly status: string;
}

export interface SecretReferenceRef {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly environmentId?: string;
  readonly name: string;
  readonly provider: string;
  readonly externalRef: string;
}

export interface AuditEventRef {
  readonly id: string;
  readonly occurredAt: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
}
