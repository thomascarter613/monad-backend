import {
  type ApiKeyPrincipal,
  type ApiKeyScope,
  generateApiKey,
} from "@monad-backend/auth";
import postgres from "postgres";

export type ControlPlaneSql = ReturnType<typeof postgres>;

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

export interface ControlPlaneDatabaseOptions {
  readonly url: string;
  readonly schema?: string;
  readonly maxConnections?: number;
}

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

interface OrganizationRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: OrganizationStatus;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

interface ProjectRow {
  readonly id: string;
  readonly organization_id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: ProjectStatus;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

interface ProjectEnvironmentRow {
  readonly id: string;
  readonly project_id: string;
  readonly organization_id: string;
  readonly name: string;
  readonly key: EnvironmentKey;
  readonly status: EnvironmentStatus;
  readonly runtime_instance_id: string | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

interface AuditEventRow {
  readonly id: string;
  readonly event_name: string;
  readonly actor_type: AuditActorType;
  readonly actor_id: string | null;
  readonly entity_type: string;
  readonly entity_id: string;
  readonly payload: Record<string, unknown> | string;
  readonly created_at: string | Date;
}

interface ApiKeyRecordRow {
  readonly id: string;
  readonly organization_id: string | null;
  readonly name: string;
  readonly key_prefix: string;
  readonly scopes: string[] | null;
  readonly status: ApiKeyStatus;
  readonly expires_at: string | Date | null;
  readonly last_used_at: string | Date | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

interface CountRow {
  readonly count: number | string;
}

interface ColumnRow {
  readonly table_name: string;
  readonly column_name: string;
}

export interface ControlPlaneSchemaValidationResult {
  readonly ok: boolean;
  readonly missing: readonly string[];
}

const requiredColumns: Record<string, readonly string[]> = {
  organizations: [
    "id",
    "name",
    "slug",
    "status",
    "created_at",
    "updated_at",
  ],
  projects: [
    "id",
    "organization_id",
    "name",
    "slug",
    "status",
    "created_at",
    "updated_at",
  ],
  project_environments: [
    "id",
    "project_id",
    "organization_id",
    "name",
    "key",
    "status",
    "runtime_instance_id",
    "created_at",
    "updated_at",
  ],
  audit_events: [
    "id",
    "event_name",
    "actor_type",
    "actor_id",
    "entity_type",
    "entity_id",
    "payload",
    "created_at",
  ],
  api_keys: [
    "id",
    "organization_id",
    "name",
    "key_prefix",
    "key_hash",
    "scopes",
    "status",
    "expires_at",
    "last_used_at",
    "created_at",
    "updated_at",
  ],
};

function assertSafeIdentifier(value: string, label: string): void {
  if (!/^[a-z_][a-z0-9_]*$/u.test(value)) {
    throw new Error(`${label} must be a safe SQL identifier. Received: ${value}`);
  }
}

function toIso(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toNullableIso(value: string | Date | null): string | null {
  return value === null ? null : toIso(value);
}

function toCount(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapProjectEnvironment(
  row: ProjectEnvironmentRow,
): ProjectEnvironment {
  return {
    id: row.id,
    projectId: row.project_id,
    organizationId: row.organization_id,
    name: row.name,
    key: row.key,
    status: row.status,
    runtimeInstanceId: row.runtime_instance_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapAuditEvent(row: AuditEventRow): AuditEvent {
  const payload =
    typeof row.payload === "string"
      ? (JSON.parse(row.payload) as Record<string, unknown>)
      : row.payload;

  return {
    id: row.id,
    eventName: row.event_name,
    actorType: row.actor_type,
    actorId: row.actor_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload,
    createdAt: toIso(row.created_at),
  };
}

function mapApiKeyRecord(row: ApiKeyRecordRow): ApiKeyRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes:
      row.scopes && row.scopes.length > 0
        ? (row.scopes as ApiKeyScope[])
        : ["management:*"],
    status: row.status,
    expiresAt: toNullableIso(row.expires_at),
    lastUsedAt: toNullableIso(row.last_used_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
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

export function createControlPlaneSql(
  options: ControlPlaneDatabaseOptions,
): ControlPlaneSql {
  return postgres(options.url, {
    max: options.maxConnections ?? 5,
    prepare: false,
  });
}

export async function validateControlPlaneSchema(
  sql: ControlPlaneSql,
  schema = "platform",
): Promise<ControlPlaneSchemaValidationResult> {
  assertSafeIdentifier(schema, "schema");

  const rows = (await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = ${schema}
      and table_name in (
        'organizations',
        'projects',
        'project_environments',
        'audit_events',
        'api_keys'
      )
  `) as unknown as ColumnRow[];

  const actual = new Set(
    rows.map((row) => `${row.table_name}.${row.column_name}`),
  );

  const missing: string[] = [];

  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    for (const column of columns) {
      const key = `${tableName}.${column}`;

      if (!actual.has(key)) {
        missing.push(key);
      }
    }
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}

export class PostgresControlPlaneRepository {
  private readonly sql: ControlPlaneSql;
  private readonly schema: string;

  constructor(options: ControlPlaneDatabaseOptions) {
    this.schema = options.schema ?? "platform";
    assertSafeIdentifier(this.schema, "schema");
    this.sql = createControlPlaneSql(options);
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }

  async health(): Promise<ControlPlaneStoreHealth> {
    const [organizations] = (await this.sql.unsafe(
      `select count(*)::text as count from ${this.table("organizations")}`,
    )) as unknown as CountRow[];

    const [projects] = (await this.sql.unsafe(
      `select count(*)::text as count from ${this.table("projects")}`,
    )) as unknown as CountRow[];

    const [environments] = (await this.sql.unsafe(
      `select count(*)::text as count from ${this.table("project_environments")}`,
    )) as unknown as CountRow[];

    const [auditEvents] = (await this.sql.unsafe(
      `select count(*)::text as count from ${this.table("audit_events")}`,
    )) as unknown as CountRow[];

    return {
      organizations: toCount(organizations?.count ?? 0),
      projects: toCount(projects?.count ?? 0),
      environments: toCount(environments?.count ?? 0),
      auditEvents: toCount(auditEvents?.count ?? 0),
    };
  }

  async createOrganization(
    input: CreateOrganizationInput,
    context: OperationContext = {},
  ): Promise<Organization> {
    const slug = input.slug ?? slugify(input.name);

    const rows = (await this.sql.unsafe(
      `
        insert into ${this.table("organizations")} (name, slug, status)
        values ($1, $2, 'active')
        returning id::text, name, slug, status, created_at, updated_at
      `,
      [input.name, slug],
    )) as unknown as OrganizationRow[];

    const organization = mapOrganization(rows[0]);

    await this.recordAuditEvent(
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
    const rows = (await this.sql.unsafe(
      `
        select id::text, name, slug, status, created_at, updated_at
        from ${this.table("organizations")}
        order by created_at asc
      `,
    )) as unknown as OrganizationRow[];

    return rows.map(mapOrganization);
  }

  async getOrganization(
    organizationId: string,
  ): Promise<Organization | undefined> {
    const rows = (await this.sql.unsafe(
      `
        select id::text, name, slug, status, created_at, updated_at
        from ${this.table("organizations")}
        where id = $1
        limit 1
      `,
      [organizationId],
    )) as unknown as OrganizationRow[];

    return rows[0] ? mapOrganization(rows[0]) : undefined;
  }

  async createProject(
    input: CreateProjectInput,
    context: OperationContext = {},
  ): Promise<Project> {
    const slug = input.slug ?? slugify(input.name);

    const rows = (await this.sql.unsafe(
      `
        insert into ${this.table(
          "projects",
        )} (organization_id, name, slug, status)
        values ($1, $2, $3, 'active')
        returning id::text, organization_id::text, name, slug, status, created_at, updated_at
      `,
      [input.organizationId, input.name, slug],
    )) as unknown as ProjectRow[];

    const project = mapProject(rows[0]);

    await this.recordAuditEvent(
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
    const rows = filter.organizationId
      ? ((await this.sql.unsafe(
          `
            select id::text, organization_id::text, name, slug, status, created_at, updated_at
            from ${this.table("projects")}
            where organization_id = $1
            order by created_at asc
          `,
          [filter.organizationId],
        )) as unknown as ProjectRow[])
      : ((await this.sql.unsafe(
          `
            select id::text, organization_id::text, name, slug, status, created_at, updated_at
            from ${this.table("projects")}
            order by created_at asc
          `,
        )) as unknown as ProjectRow[]);

    return rows.map(mapProject);
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    const rows = (await this.sql.unsafe(
      `
        select id::text, organization_id::text, name, slug, status, created_at, updated_at
        from ${this.table("projects")}
        where id = $1
        limit 1
      `,
      [projectId],
    )) as unknown as ProjectRow[];

    return rows[0] ? mapProject(rows[0]) : undefined;
  }

  async createProjectEnvironment(
    input: CreateProjectEnvironmentInput,
    context: OperationContext = {},
  ): Promise<ProjectEnvironment> {
    const project = await this.getProject(input.projectId);

    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const rows = (await this.sql.unsafe(
      `
        insert into ${this.table(
          "project_environments",
        )} (project_id, organization_id, name, "key", status, runtime_instance_id)
        values ($1, $2, $3, $4, 'requested', null)
        returning
          id::text,
          project_id::text,
          organization_id::text,
          name,
          "key",
          status,
          runtime_instance_id::text,
          created_at,
          updated_at
      `,
      [project.id, project.organizationId, input.name, input.key ?? "development"],
    )) as unknown as ProjectEnvironmentRow[];

    const environment = mapProjectEnvironment(rows[0]);

    await this.recordAuditEvent(
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
    const rows = (await this.sql.unsafe(
      `
        select
          id::text,
          project_id::text,
          organization_id::text,
          name,
          "key",
          status,
          runtime_instance_id::text,
          created_at,
          updated_at
        from ${this.table("project_environments")}
        where project_id = $1
        order by created_at asc
      `,
      [projectId],
    )) as unknown as ProjectEnvironmentRow[];

    return rows.map(mapProjectEnvironment);
  }

  async getEnvironment(
    environmentId: string,
  ): Promise<ProjectEnvironment | undefined> {
    const rows = (await this.sql.unsafe(
      `
        select
          id::text,
          project_id::text,
          organization_id::text,
          name,
          "key",
          status,
          runtime_instance_id::text,
          created_at,
          updated_at
        from ${this.table("project_environments")}
        where id = $1
        limit 1
      `,
      [environmentId],
    )) as unknown as ProjectEnvironmentRow[];

    return rows[0] ? mapProjectEnvironment(rows[0]) : undefined;
  }

  async createApiKey(
    input: CreateApiKeyInput,
    context: OperationContext = {},
  ): Promise<CreatedApiKey> {
    const generated = generateApiKey();
    const scopes = input.scopes && input.scopes.length > 0
      ? [...input.scopes]
      : ["management:*"];

    const rows = (await this.sql.unsafe(
      `
        insert into ${this.table(
          "api_keys",
        )} (organization_id, name, key_prefix, key_hash, scopes, status, expires_at)
        values ($1, $2, $3, $4, $5::text[], 'active', $6)
        returning
          id::text,
          organization_id::text,
          name,
          key_prefix,
          scopes,
          status,
          expires_at,
          last_used_at,
          created_at,
          updated_at
      `,
      [
        input.organizationId ?? null,
        input.name,
        generated.prefix,
        generated.hash,
        scopes,
        input.expiresAt ?? null,
      ],
    )) as unknown as ApiKeyRecordRow[];

    const record = mapApiKeyRecord(rows[0]);

    await this.recordAuditEvent(
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
      record,
    };
  }

  async listApiKeys(
    filter: ListApiKeysFilter = {},
  ): Promise<readonly ApiKeyRecord[]> {
    if (filter.organizationId && filter.status) {
      const rows = (await this.sql.unsafe(
        `
          select
            id::text,
            organization_id::text,
            name,
            key_prefix,
            scopes,
            status,
            expires_at,
            last_used_at,
            created_at,
            updated_at
          from ${this.table("api_keys")}
          where organization_id = $1 and status = $2
          order by created_at desc
        `,
        [filter.organizationId, filter.status],
      )) as unknown as ApiKeyRecordRow[];

      return rows.map(mapApiKeyRecord);
    }

    if (filter.organizationId) {
      const rows = (await this.sql.unsafe(
        `
          select
            id::text,
            organization_id::text,
            name,
            key_prefix,
            scopes,
            status,
            expires_at,
            last_used_at,
            created_at,
            updated_at
          from ${this.table("api_keys")}
          where organization_id = $1
          order by created_at desc
        `,
        [filter.organizationId],
      )) as unknown as ApiKeyRecordRow[];

      return rows.map(mapApiKeyRecord);
    }

    if (filter.status) {
      const rows = (await this.sql.unsafe(
        `
          select
            id::text,
            organization_id::text,
            name,
            key_prefix,
            scopes,
            status,
            expires_at,
            last_used_at,
            created_at,
            updated_at
          from ${this.table("api_keys")}
          where status = $1
          order by created_at desc
        `,
        [filter.status],
      )) as unknown as ApiKeyRecordRow[];

      return rows.map(mapApiKeyRecord);
    }

    const rows = (await this.sql.unsafe(
      `
        select
          id::text,
          organization_id::text,
          name,
          key_prefix,
          scopes,
          status,
          expires_at,
          last_used_at,
          created_at,
          updated_at
        from ${this.table("api_keys")}
        order by created_at desc
      `,
    )) as unknown as ApiKeyRecordRow[];

    return rows.map(mapApiKeyRecord);
  }

  async revokeApiKey(
    input: RevokeApiKeyInput,
    context: OperationContext = {},
  ): Promise<ApiKeyRecord | undefined> {
    const rows = (await this.sql.unsafe(
      `
        update ${this.table("api_keys")}
        set status = 'revoked', updated_at = now()
        where id = $1
        returning
          id::text,
          organization_id::text,
          name,
          key_prefix,
          scopes,
          status,
          expires_at,
          last_used_at,
          created_at,
          updated_at
      `,
      [input.apiKeyId],
    )) as unknown as ApiKeyRecordRow[];

    if (!rows[0]) {
      return undefined;
    }

    const record = mapApiKeyRecord(rows[0]);

    await this.recordAuditEvent(
      {
        eventName: "api_key.revoked",
        entityType: "api_key",
        entityId: record.id,
        payload: {
          apiKeyId: record.id,
          organizationId: record.organizationId,
          name: record.name,
          keyPrefix: record.keyPrefix,
        },
      },
      context,
    );

    return record;
  }

  async rotateApiKey(
    input: RotateApiKeyInput,
    context: OperationContext = {},
  ): Promise<CreatedApiKey | undefined> {
    const generated = generateApiKey();

    const rows = (await this.sql.unsafe(
      `
        update ${this.table("api_keys")}
        set
          key_prefix = $2,
          key_hash = $3,
          status = 'active',
          expires_at = $4,
          last_used_at = null,
          updated_at = now()
        where id = $1
        returning
          id::text,
          organization_id::text,
          name,
          key_prefix,
          scopes,
          status,
          expires_at,
          last_used_at,
          created_at,
          updated_at
      `,
      [
        input.apiKeyId,
        generated.prefix,
        generated.hash,
        input.expiresAt ?? null,
      ],
    )) as unknown as ApiKeyRecordRow[];

    if (!rows[0]) {
      return undefined;
    }

    const record = mapApiKeyRecord(rows[0]);

    await this.recordAuditEvent(
      {
        eventName: "api_key.rotated",
        entityType: "api_key",
        entityId: record.id,
        payload: {
          apiKeyId: record.id,
          organizationId: record.organizationId,
          name: record.name,
          keyPrefix: record.keyPrefix,
        },
      },
      context,
    );

    return {
      apiKey: generated.apiKey,
      record,
    };
  }

  async listAuditEvents(
    filter: ListAuditEventsFilter = {},
  ): Promise<readonly AuditEvent[]> {
    const limit = filter.limit ?? 100;

    if (filter.entityType && filter.entityId) {
      const rows = (await this.sql.unsafe(
        `
          select
            id::text,
            event_name,
            actor_type,
            actor_id::text,
            entity_type,
            entity_id::text,
            payload,
            created_at
          from ${this.table("audit_events")}
          where entity_type = $1 and entity_id = $2
          order by created_at desc
          limit $3
        `,
        [filter.entityType, filter.entityId, limit],
      )) as unknown as AuditEventRow[];

      return rows.map(mapAuditEvent);
    }

    if (filter.entityType) {
      const rows = (await this.sql.unsafe(
        `
          select
            id::text,
            event_name,
            actor_type,
            actor_id::text,
            entity_type,
            entity_id::text,
            payload,
            created_at
          from ${this.table("audit_events")}
          where entity_type = $1
          order by created_at desc
          limit $2
        `,
        [filter.entityType, limit],
      )) as unknown as AuditEventRow[];

      return rows.map(mapAuditEvent);
    }

    if (filter.entityId) {
      const rows = (await this.sql.unsafe(
        `
          select
            id::text,
            event_name,
            actor_type,
            actor_id::text,
            entity_type,
            entity_id::text,
            payload,
            created_at
          from ${this.table("audit_events")}
          where entity_id = $1
          order by created_at desc
          limit $2
        `,
        [filter.entityId, limit],
      )) as unknown as AuditEventRow[];

      return rows.map(mapAuditEvent);
    }

    const rows = (await this.sql.unsafe(
      `
        select
          id::text,
          event_name,
          actor_type,
          actor_id::text,
          entity_type,
          entity_id::text,
          payload,
          created_at
        from ${this.table("audit_events")}
        order by created_at desc
        limit $1
      `,
      [limit],
    )) as unknown as AuditEventRow[];

    return rows.map(mapAuditEvent);
  }

  private async recordAuditEvent(
    input: {
      readonly eventName: string;
      readonly entityType: string;
      readonly entityId: string;
      readonly payload: Record<string, unknown>;
    },
    context: OperationContext = {},
  ): Promise<AuditEvent> {
    const actor = actorFromContext(context);

    const rows = (await this.sql.unsafe(
      `
        insert into ${this.table(
          "audit_events",
        )} (event_name, actor_type, actor_id, entity_type, entity_id, payload)
        values ($1, $2, $3, $4, $5, $6::jsonb)
        returning
          id::text,
          event_name,
          actor_type,
          actor_id::text,
          entity_type,
          entity_id::text,
          payload,
          created_at
      `,
      [
        input.eventName,
        actor.actorType,
        actor.actorId,
        input.entityType,
        input.entityId,
        JSON.stringify(input.payload),
      ],
    )) as unknown as AuditEventRow[];

    return mapAuditEvent(rows[0]);
  }

  private table(tableName: keyof typeof requiredColumns): string {
    assertSafeIdentifier(tableName, "tableName");
    return `"${this.schema}"."${tableName}"`;
  }
}

export function createPostgresControlPlaneRepository(
  options: ControlPlaneDatabaseOptions,
): PostgresControlPlaneRepository {
  return new PostgresControlPlaneRepository(options);
}
