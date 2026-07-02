import type { ApiKeyPrincipal, ApiKeyScope } from "@monad-backend/auth";
import { generateApiKey, hashApiKey } from "@monad-backend/auth";

export type OrganizationStatus = "active" | "disabled";
export type ProjectStatus = "active" | "archived";
export type EnvironmentStatus =
  | "requested"
  | "provisioning"
  | "ready"
  | "failed"
  | "disabled";

export type EnvironmentKey =
  | "local"
  | "preview"
  | "development"
  | "staging"
  | "production";

export type AuditActorType = "system" | "user" | "api_key" | "service";
export type ApiKeyStatus = "active" | "disabled" | "revoked";

export interface OperationContext {
  readonly actor?: ApiKeyPrincipal;
}

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: OrganizationStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Project {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly slug: string;
  readonly status: ProjectStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProjectEnvironment {
  readonly id: string;
  readonly projectId: string;
  readonly organizationId: string;
  readonly name: string;
  readonly key: EnvironmentKey;
  readonly status: EnvironmentStatus;
  readonly runtimeInstanceId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly eventName: string;
  readonly actorType: AuditActorType;
  readonly actorId: string | null;
  readonly entityType: string;
  readonly entityId: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
}

export interface ApiKeyRecord {
  readonly id: string;
  readonly organizationId: string | null;
  readonly name: string;
  readonly keyPrefix: string;
  readonly scopes: readonly ApiKeyScope[];
  readonly status: ApiKeyStatus;
  readonly expiresAt: string | null;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatedApiKey {
  readonly apiKey: string;
  readonly record: ApiKeyRecord;
}

export interface CreateOrganizationInput {
  readonly name: string;
  readonly slug?: string;
}

export interface CreateProjectInput {
  readonly organizationId: string;
  readonly name: string;
  readonly slug?: string;
}

export interface CreateProjectEnvironmentInput {
  readonly projectId: string;
  readonly name: string;
  readonly key?: EnvironmentKey;
}

export interface CreateApiKeyInput {
  readonly organizationId?: string | null;
  readonly name: string;
  readonly scopes?: readonly ApiKeyScope[];
  readonly expiresAt?: string | null;
}

export interface RotateApiKeyInput {
  readonly apiKeyId: string;
  readonly expiresAt?: string | null;
}

export interface RevokeApiKeyInput {
  readonly apiKeyId: string;
}

export interface ListProjectsFilter {
  readonly organizationId?: string;
}

export interface ListApiKeysFilter {
  readonly organizationId?: string;
  readonly status?: ApiKeyStatus;
}

export interface ListAuditEventsFilter {
  readonly entityType?: string;
  readonly entityId?: string;
  readonly limit?: number;
}

export interface ControlPlaneStoreHealth {
  readonly organizations: number;
  readonly projects: number;
  readonly environments: number;
  readonly auditEvents: number;
}

export interface ControlPlaneStore {
  health(): Promise<ControlPlaneStoreHealth>;

  createOrganization(
    input: CreateOrganizationInput,
    context?: OperationContext,
  ): Promise<Organization>;
  listOrganizations(): Promise<readonly Organization[]>;
  getOrganization(organizationId: string): Promise<Organization | undefined>;

  createProject(
    input: CreateProjectInput,
    context?: OperationContext,
  ): Promise<Project>;
  listProjects(filter?: ListProjectsFilter): Promise<readonly Project[]>;
  getProject(projectId: string): Promise<Project | undefined>;

  createProjectEnvironment(
    input: CreateProjectEnvironmentInput,
    context?: OperationContext,
  ): Promise<ProjectEnvironment>;
  listProjectEnvironments(
    projectId: string,
  ): Promise<readonly ProjectEnvironment[]>;
  getEnvironment(environmentId: string): Promise<ProjectEnvironment | undefined>;

  createApiKey(
    input: CreateApiKeyInput,
    context?: OperationContext,
  ): Promise<CreatedApiKey>;
  listApiKeys(filter?: ListApiKeysFilter): Promise<readonly ApiKeyRecord[]>;
  revokeApiKey(
    input: RevokeApiKeyInput,
    context?: OperationContext,
  ): Promise<ApiKeyRecord | undefined>;
  rotateApiKey(
    input: RotateApiKeyInput,
    context?: OperationContext,
  ): Promise<CreatedApiKey | undefined>;

  listAuditEvents(filter?: ListAuditEventsFilter): Promise<readonly AuditEvent[]>;
}

interface InternalApiKeyRecord extends ApiKeyRecord {
  readonly keyHash: string;
}

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function actorFromContext(context: OperationContext = {}): {
  readonly actorType: AuditActorType;
  readonly actorId: string | null;
} {
  if (!context.actor) {
    return {
      actorType: "system",
      actorId: null,
    };
  }

  return {
    actorType: context.actor.actorType,
    actorId: context.actor.actorId,
  };
}

function publicApiKeyRecord(record: InternalApiKeyRecord): ApiKeyRecord {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    keyPrefix: record.keyPrefix,
    scopes: record.scopes,
    status: record.status,
    expiresAt: record.expiresAt,
    lastUsedAt: record.lastUsedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class InMemoryControlPlaneStore implements ControlPlaneStore {
  private readonly organizations = new Map<string, Organization>();
  private readonly projects = new Map<string, Project>();
  private readonly environments = new Map<string, ProjectEnvironment>();
  private readonly apiKeys = new Map<string, InternalApiKeyRecord>();
  private readonly auditEvents: AuditEvent[] = [];

  async health(): Promise<ControlPlaneStoreHealth> {
    return {
      organizations: this.organizations.size,
      projects: this.projects.size,
      environments: this.environments.size,
      auditEvents: this.auditEvents.length,
    };
  }

  async createOrganization(
    input: CreateOrganizationInput,
    context: OperationContext = {},
  ): Promise<Organization> {
    const timestamp = now();
    const organization: Organization = {
      id: id("org"),
      name: input.name,
      slug: input.slug ?? slugify(input.name),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.organizations.set(organization.id, organization);

    this.recordAuditEvent(
      {
        eventName: "organization.created",
        entityType: "organization",
        entityId: organization.id,
        payload: {
          organizationId: organization.id,
          slug: organization.slug,
        },
      },
      context,
    );

    return organization;
  }

  async listOrganizations(): Promise<readonly Organization[]> {
    return [...this.organizations.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  async getOrganization(
    organizationId: string,
  ): Promise<Organization | undefined> {
    return this.organizations.get(organizationId);
  }

  async createProject(
    input: CreateProjectInput,
    context: OperationContext = {},
  ): Promise<Project> {
    const timestamp = now();
    const project: Project = {
      id: id("proj"),
      organizationId: input.organizationId,
      name: input.name,
      slug: input.slug ?? slugify(input.name),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.projects.set(project.id, project);

    this.recordAuditEvent(
      {
        eventName: "project.created",
        entityType: "project",
        entityId: project.id,
        payload: {
          organizationId: project.organizationId,
          projectId: project.id,
          slug: project.slug,
        },
      },
      context,
    );

    return project;
  }

  async listProjects(
    filter: ListProjectsFilter = {},
  ): Promise<readonly Project[]> {
    return [...this.projects.values()]
      .filter((project) =>
        filter.organizationId
          ? project.organizationId === filter.organizationId
          : true,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    return this.projects.get(projectId);
  }

  async createProjectEnvironment(
    input: CreateProjectEnvironmentInput,
    context: OperationContext = {},
  ): Promise<ProjectEnvironment> {
    const project = await this.getProject(input.projectId);

    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const timestamp = now();
    const environment: ProjectEnvironment = {
      id: id("env"),
      projectId: project.id,
      organizationId: project.organizationId,
      name: input.name,
      key: input.key ?? "development",
      status: "requested",
      runtimeInstanceId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.environments.set(environment.id, environment);

    this.recordAuditEvent(
      {
        eventName: "project_environment.created",
        entityType: "project_environment",
        entityId: environment.id,
        payload: {
          organizationId: environment.organizationId,
          projectId: environment.projectId,
          environmentId: environment.id,
          key: environment.key,
        },
      },
      context,
    );

    return environment;
  }

  async listProjectEnvironments(
    projectId: string,
  ): Promise<readonly ProjectEnvironment[]> {
    return [...this.environments.values()]
      .filter((environment) => environment.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getEnvironment(
    environmentId: string,
  ): Promise<ProjectEnvironment | undefined> {
    return this.environments.get(environmentId);
  }

  async createApiKey(
    input: CreateApiKeyInput,
    context: OperationContext = {},
  ): Promise<CreatedApiKey> {
    const generated = generateApiKey();
    const timestamp = now();

    const record: InternalApiKeyRecord = {
      id: id("key"),
      organizationId: input.organizationId ?? null,
      name: input.name,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      scopes:
        input.scopes && input.scopes.length > 0
          ? [...input.scopes]
          : ["management:*"],
      status: "active",
      expiresAt: input.expiresAt ?? null,
      lastUsedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.apiKeys.set(record.id, record);

    this.recordAuditEvent(
      {
        eventName: "api_key.created",
        entityType: "api_key",
        entityId: record.id,
        payload: {
          apiKeyId: record.id,
          organizationId: record.organizationId,
          name: record.name,
          keyPrefix: record.keyPrefix,
          scopes: record.scopes,
        },
      },
      context,
    );

    return {
      apiKey: generated.apiKey,
      record: publicApiKeyRecord(record),
    };
  }

  async listApiKeys(
    filter: ListApiKeysFilter = {},
  ): Promise<readonly ApiKeyRecord[]> {
    return [...this.apiKeys.values()]
      .filter((apiKey) =>
        filter.organizationId ? apiKey.organizationId === filter.organizationId : true,
      )
      .filter((apiKey) => (filter.status ? apiKey.status === filter.status : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(publicApiKeyRecord);
  }

  async revokeApiKey(
    input: RevokeApiKeyInput,
    context: OperationContext = {},
  ): Promise<ApiKeyRecord | undefined> {
    const existing = this.apiKeys.get(input.apiKeyId);

    if (!existing) {
      return undefined;
    }

    const updated: InternalApiKeyRecord = {
      ...existing,
      status: "revoked",
      updatedAt: now(),
    };

    this.apiKeys.set(updated.id, updated);

    this.recordAuditEvent(
      {
        eventName: "api_key.revoked",
        entityType: "api_key",
        entityId: updated.id,
        payload: {
          apiKeyId: updated.id,
          organizationId: updated.organizationId,
          name: updated.name,
          keyPrefix: updated.keyPrefix,
        },
      },
      context,
    );

    return publicApiKeyRecord(updated);
  }

  async rotateApiKey(
    input: RotateApiKeyInput,
    context: OperationContext = {},
  ): Promise<CreatedApiKey | undefined> {
    const existing = this.apiKeys.get(input.apiKeyId);

    if (!existing) {
      return undefined;
    }

    const generated = generateApiKey();

    const updated: InternalApiKeyRecord = {
      ...existing,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      status: "active",
      expiresAt: input.expiresAt ?? null,
      lastUsedAt: null,
      updatedAt: now(),
    };

    this.apiKeys.set(updated.id, updated);

    this.recordAuditEvent(
      {
        eventName: "api_key.rotated",
        entityType: "api_key",
        entityId: updated.id,
        payload: {
          apiKeyId: updated.id,
          organizationId: updated.organizationId,
          name: updated.name,
          keyPrefix: updated.keyPrefix,
        },
      },
      context,
    );

    return {
      apiKey: generated.apiKey,
      record: publicApiKeyRecord(updated),
    };
  }

  async listAuditEvents(
    filter: ListAuditEventsFilter = {},
  ): Promise<readonly AuditEvent[]> {
    const limit = filter.limit ?? 100;

    return this.auditEvents
      .filter((event) =>
        filter.entityType ? event.entityType === filter.entityType : true,
      )
      .filter((event) =>
        filter.entityId ? event.entityId === filter.entityId : true,
      )
      .slice(-limit)
      .reverse();
  }

  private recordAuditEvent(
    input: {
      readonly eventName: string;
      readonly entityType: string;
      readonly entityId: string;
      readonly payload: Record<string, unknown>;
    },
    context: OperationContext = {},
  ): AuditEvent {
    const actor = actorFromContext(context);

    const event: AuditEvent = {
      id: id("audit"),
      eventName: input.eventName,
      actorType: actor.actorType,
      actorId: actor.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      createdAt: now(),
    };

    this.auditEvents.push(event);

    return event;
  }
}

export function createInMemoryControlPlaneStore(): ControlPlaneStore {
  return new InMemoryControlPlaneStore();
}

export function hashInMemoryApiKey(apiKey: string): string {
  return hashApiKey(apiKey).hash;
}
