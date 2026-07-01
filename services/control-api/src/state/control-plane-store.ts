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

export interface ListProjectsFilter {
  readonly organizationId?: string;
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
  health(): ControlPlaneStoreHealth;

  createOrganization(input: CreateOrganizationInput): Organization;
  listOrganizations(): readonly Organization[];
  getOrganization(organizationId: string): Organization | undefined;

  createProject(input: CreateProjectInput): Project;
  listProjects(filter?: ListProjectsFilter): readonly Project[];
  getProject(projectId: string): Project | undefined;

  createProjectEnvironment(
    input: CreateProjectEnvironmentInput,
  ): ProjectEnvironment;
  listProjectEnvironments(projectId: string): readonly ProjectEnvironment[];
  getEnvironment(environmentId: string): ProjectEnvironment | undefined;

  listAuditEvents(filter?: ListAuditEventsFilter): readonly AuditEvent[];
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

export class InMemoryControlPlaneStore implements ControlPlaneStore {
  private readonly organizations = new Map<string, Organization>();
  private readonly projects = new Map<string, Project>();
  private readonly environments = new Map<string, ProjectEnvironment>();
  private readonly auditEvents: AuditEvent[] = [];

  health(): ControlPlaneStoreHealth {
    return {
      organizations: this.organizations.size,
      projects: this.projects.size,
      environments: this.environments.size,
      auditEvents: this.auditEvents.length,
    };
  }

  createOrganization(input: CreateOrganizationInput): Organization {
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

    this.recordAuditEvent({
      eventName: "organization.created",
      entityType: "organization",
      entityId: organization.id,
      payload: {
        organizationId: organization.id,
        slug: organization.slug,
      },
    });

    return organization;
  }

  listOrganizations(): readonly Organization[] {
    return [...this.organizations.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  getOrganization(organizationId: string): Organization | undefined {
    return this.organizations.get(organizationId);
  }

  createProject(input: CreateProjectInput): Project {
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

    this.recordAuditEvent({
      eventName: "project.created",
      entityType: "project",
      entityId: project.id,
      payload: {
        organizationId: project.organizationId,
        projectId: project.id,
        slug: project.slug,
      },
    });

    return project;
  }

  listProjects(filter: ListProjectsFilter = {}): readonly Project[] {
    return [...this.projects.values()]
      .filter((project) =>
        filter.organizationId
          ? project.organizationId === filter.organizationId
          : true,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  createProjectEnvironment(
    input: CreateProjectEnvironmentInput,
  ): ProjectEnvironment {
    const project = this.getProject(input.projectId);

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

    this.recordAuditEvent({
      eventName: "project_environment.created",
      entityType: "project_environment",
      entityId: environment.id,
      payload: {
        organizationId: environment.organizationId,
        projectId: environment.projectId,
        environmentId: environment.id,
        key: environment.key,
      },
    });

    return environment;
  }

  listProjectEnvironments(projectId: string): readonly ProjectEnvironment[] {
    return [...this.environments.values()]
      .filter((environment) => environment.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getEnvironment(environmentId: string): ProjectEnvironment | undefined {
    return this.environments.get(environmentId);
  }

  listAuditEvents(filter: ListAuditEventsFilter = {}): readonly AuditEvent[] {
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

  private recordAuditEvent(input: {
    readonly eventName: string;
    readonly entityType: string;
    readonly entityId: string;
    readonly payload: Record<string, unknown>;
  }): AuditEvent {
    const event: AuditEvent = {
      id: id("audit"),
      eventName: input.eventName,
      actorType: "system",
      actorId: null,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      createdAt: now(),
    };

    this.auditEvents.push(event);

    return event;
  }
}

export function createControlPlaneStore(): ControlPlaneStore {
  return new InMemoryControlPlaneStore();
}
