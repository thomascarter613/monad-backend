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
  health(): Promise<ControlPlaneStoreHealth>;

  createOrganization(input: CreateOrganizationInput): Promise<Organization>;
  listOrganizations(): Promise<readonly Organization[]>;
  getOrganization(organizationId: string): Promise<Organization | undefined>;

  createProject(input: CreateProjectInput): Promise<Project>;
  listProjects(filter?: ListProjectsFilter): Promise<readonly Project[]>;
  getProject(projectId: string): Promise<Project | undefined>;

  createProjectEnvironment(
    input: CreateProjectEnvironmentInput,
  ): Promise<ProjectEnvironment>;
  listProjectEnvironments(
    projectId: string,
  ): Promise<readonly ProjectEnvironment[]>;
  getEnvironment(environmentId: string): Promise<ProjectEnvironment | undefined>;

  listAuditEvents(filter?: ListAuditEventsFilter): Promise<readonly AuditEvent[]>;
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

  async createProject(input: CreateProjectInput): Promise<Project> {
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

export function createInMemoryControlPlaneStore(): ControlPlaneStore {
  return new InMemoryControlPlaneStore();
}
