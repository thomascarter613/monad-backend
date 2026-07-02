#!/usr/bin/bash
set -euo pipefail

echo "Starting WP-0005: Control API Database Adapter and Persistence Boundary"

mkdir -p packages/database/src
mkdir -p services/control-api/src/scripts
mkdir -p services/control-api/src/state
mkdir -p docs/database
mkdir -p docs/work-packets

python3 - <<'PY'
import json
from pathlib import Path

def read_json(path: Path, fallback: dict) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return fallback

def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n")

root = Path("package.json")
pkg = read_json(root, {
    "name": "open-backend-cloud",
    "private": True,
    "type": "module",
    "workspaces": ["apps/*", "services/*", "packages/*"],
    "scripts": {}
})

pkg.setdefault("name", "open-backend-cloud")
pkg.setdefault("private", True)
pkg.setdefault("type", "module")

workspaces = pkg.get("workspaces", [])
required_workspaces = ["apps/*", "services/*", "packages/*"]

if isinstance(workspaces, list):
    for workspace in required_workspaces:
        if workspace not in workspaces:
            workspaces.append(workspace)
    pkg["workspaces"] = workspaces
elif isinstance(workspaces, dict):
    packages = workspaces.setdefault("packages", [])
    for workspace in required_workspaces:
        if workspace not in packages:
            packages.append(workspace)
else:
    pkg["workspaces"] = required_workspaces

scripts = pkg.setdefault("scripts", {})

scripts["config:check"] = "cd packages/config && bun run check"
scripts["database:check"] = "cd packages/database && bun run check"
scripts["sdk:check"] = "cd packages/sdk && bun run check"
scripts["control-api:dev"] = "cd services/control-api && bun run dev"
scripts["control-api:start"] = "cd services/control-api && bun run start"
scripts["control-api:check"] = "cd services/control-api && bun run check"
scripts["control-api:test"] = "cd services/control-api && bun test"
scripts["control-api:db:check"] = "cd services/control-api && bun run db:check"
scripts["check:wp0005"] = "bun run config:check && bun run database:check && bun run sdk:check && bun run control-api:check"

existing_check = scripts.get("check")

if not existing_check:
    scripts["check"] = "bun run check:wp0005"
elif "check:wp0005" not in existing_check:
    if "check:base" not in scripts:
        scripts["check:base"] = existing_check
    scripts["check"] = "bun run check:base && bun run check:wp0005"

write_json(root, pkg)

database_pkg_path = Path("packages/database/package.json")
database_pkg = read_json(database_pkg_path, {
    "name": "@monad-backend/database",
    "version": "0.1.0",
    "private": True,
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": {
        ".": "./src/index.ts"
    },
    "scripts": {},
    "dependencies": {},
    "devDependencies": {}
})

database_pkg.setdefault("name", "@monad-backend/database")
database_pkg.setdefault("version", "0.1.0")
database_pkg.setdefault("private", True)
database_pkg.setdefault("type", "module")
database_pkg["main"] = "./src/index.ts"
database_pkg["types"] = "./src/index.ts"
database_pkg["exports"] = {".": "./src/index.ts"}
database_pkg.setdefault("scripts", {})["check"] = "tsc --noEmit -p tsconfig.json"
database_pkg.setdefault("dependencies", {})["postgres"] = "latest"
database_pkg.setdefault("devDependencies", {})["@types/bun"] = "latest"
database_pkg.setdefault("devDependencies", {})["typescript"] = "latest"

write_json(database_pkg_path, database_pkg)

control_api_pkg_path = Path("services/control-api/package.json")
control_api_pkg = read_json(control_api_pkg_path, {
    "name": "@monad-backend/control-api",
    "version": "0.1.0",
    "private": True,
    "type": "module",
    "main": "./src/index.ts",
    "scripts": {},
    "dependencies": {},
    "devDependencies": {}
})

control_api_pkg.setdefault("scripts", {})
control_api_pkg["scripts"]["dev"] = "bun --watch src/index.ts"
control_api_pkg["scripts"]["start"] = "bun src/index.ts"
control_api_pkg["scripts"]["test"] = "bun test"
control_api_pkg["scripts"]["typecheck"] = "tsc --noEmit -p tsconfig.json"
control_api_pkg["scripts"]["check"] = "bun test && bun run typecheck"
control_api_pkg["scripts"]["db:check"] = "bun src/scripts/check-database.ts"

control_api_pkg.setdefault("dependencies", {})
control_api_pkg["dependencies"]["@monad-backend/config"] = "workspace:*"
control_api_pkg["dependencies"]["@monad-backend/database"] = "workspace:*"
control_api_pkg["dependencies"]["elysia"] = "latest"

control_api_pkg.setdefault("devDependencies", {})
control_api_pkg["devDependencies"]["@types/bun"] = "latest"
control_api_pkg["devDependencies"]["typescript"] = "latest"

write_json(control_api_pkg_path, control_api_pkg)
PY

cat > packages/database/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["bun"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"]
}
EOF

cat > packages/config/src/index.ts <<'EOF'
export type RuntimeEnvironment =
  | "local"
  | "test"
  | "development"
  | "staging"
  | "production";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export type ControlApiStoreMode = "memory" | "database";

export interface ControlPlaneDatabaseConfig {
  readonly url: string | undefined;
  readonly schema: string;
  readonly maxConnections: number;
}

export interface ControlApiConfig {
  readonly serviceName: "control-api";
  readonly version: string;
  readonly environment: RuntimeEnvironment;
  readonly hostname: string;
  readonly port: number;
  readonly publicBaseUrl: string;
  readonly logLevel: LogLevel;
  readonly storeMode: ControlApiStoreMode;
  readonly database: ControlPlaneDatabaseConfig;
}

function readString(
  env: Record<string, string | undefined>,
  key: string,
  fallback: string,
): string {
  const value = env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function readOptionalString(
  env: Record<string, string | undefined>,
  key: string,
): string | undefined {
  const value = env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(
  env: Record<string, string | undefined>,
  key: string,
  fallback: number,
): number {
  const value = env[key];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a finite number.`);
  }

  return parsed;
}

function readRuntimeEnvironment(
  env: Record<string, string | undefined>,
): RuntimeEnvironment {
  const value = readString(env, "CONTROL_API_ENV", "local");

  if (
    value === "local" ||
    value === "test" ||
    value === "development" ||
    value === "staging" ||
    value === "production"
  ) {
    return value;
  }

  throw new Error(
    `CONTROL_API_ENV must be one of local, test, development, staging, production. Received: ${value}`,
  );
}

function readLogLevel(env: Record<string, string | undefined>): LogLevel {
  const value = readString(env, "CONTROL_API_LOG_LEVEL", "info");

  if (
    value === "trace" ||
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error"
  ) {
    return value;
  }

  throw new Error(
    `CONTROL_API_LOG_LEVEL must be one of trace, debug, info, warn, error. Received: ${value}`,
  );
}

function readStoreMode(
  env: Record<string, string | undefined>,
): ControlApiStoreMode {
  const value = readString(env, "CONTROL_API_STORE_MODE", "memory");

  if (value === "memory" || value === "database") {
    return value;
  }

  throw new Error(
    `CONTROL_API_STORE_MODE must be either memory or database. Received: ${value}`,
  );
}

export function loadControlApiConfig(
  env: Record<string, string | undefined> = Bun.env,
): ControlApiConfig {
  const hostname = readString(env, "CONTROL_API_HOST", "127.0.0.1");
  const port = readNumber(env, "CONTROL_API_PORT", 4310);

  return {
    serviceName: "control-api",
    version: readString(env, "CONTROL_API_VERSION", "0.1.0"),
    environment: readRuntimeEnvironment(env),
    hostname,
    port,
    publicBaseUrl: readString(
      env,
      "CONTROL_API_PUBLIC_BASE_URL",
      `http://${hostname}:${port}`,
    ),
    logLevel: readLogLevel(env),
    storeMode: readStoreMode(env),
    database: {
      url:
        readOptionalString(env, "CONTROL_PLANE_DATABASE_URL") ??
        readOptionalString(env, "DATABASE_URL"),
      schema: readString(env, "CONTROL_PLANE_DATABASE_SCHEMA", "platform"),
      maxConnections: readNumber(env, "CONTROL_PLANE_DATABASE_MAX", 5),
    },
  };
}
EOF

cat > packages/database/src/control-plane-repository.ts <<'EOF'
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

export interface ControlPlaneDatabaseOptions {
  readonly url: string;
  readonly schema?: string;
  readonly maxConnections?: number;
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
        'audit_events'
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

    await this.recordAuditEvent({
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

  async createProject(input: CreateProjectInput): Promise<Project> {
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

    await this.recordAuditEvent({
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

    await this.recordAuditEvent({
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

  private async recordAuditEvent(input: {
    readonly eventName: string;
    readonly entityType: string;
    readonly entityId: string;
    readonly payload: Record<string, unknown>;
  }): Promise<AuditEvent> {
    const rows = (await this.sql.unsafe(
      `
        insert into ${this.table(
          "audit_events",
        )} (event_name, actor_type, actor_id, entity_type, entity_id, payload)
        values ($1, 'system', null, $2, $3, $4::jsonb)
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
EOF

cat > packages/database/src/index.ts <<'EOF'
export * from "./control-plane-repository";
EOF

cat > services/control-api/src/state/control-plane-store.ts <<'EOF'
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
EOF

cat > services/control-api/src/state/database-control-plane-store.ts <<'EOF'
import type { ControlApiConfig } from "@monad-backend/config";
import { createPostgresControlPlaneRepository } from "@monad-backend/database";
import type { ControlPlaneStore } from "./control-plane-store";

export function createDatabaseControlPlaneStore(
  config: ControlApiConfig,
): ControlPlaneStore {
  if (!config.database.url) {
    throw new Error(
      "CONTROL_PLANE_DATABASE_URL or DATABASE_URL is required when CONTROL_API_STORE_MODE=database.",
    );
  }

  return createPostgresControlPlaneRepository({
    url: config.database.url,
    schema: config.database.schema,
    maxConnections: config.database.maxConnections,
  }) as ControlPlaneStore;
}
EOF

cat > services/control-api/src/state/configured-control-plane-store.ts <<'EOF'
import type { ControlApiConfig } from "@monad-backend/config";
import type { ControlPlaneStore } from "./control-plane-store";
import { createInMemoryControlPlaneStore } from "./control-plane-store";
import { createDatabaseControlPlaneStore } from "./database-control-plane-store";

export function createConfiguredControlPlaneStore(
  config: ControlApiConfig,
): ControlPlaneStore {
  if (config.storeMode === "database") {
    return createDatabaseControlPlaneStore(config);
  }

  return createInMemoryControlPlaneStore();
}
EOF

cat > services/control-api/src/routes/health.ts <<'EOF'
import type { ControlApiConfig } from "@monad-backend/config";
import { Elysia } from "elysia";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createHealthRoutes(
  config: ControlApiConfig,
  store: ControlPlaneStore,
): Elysia {
  return new Elysia()
    .get("/health", () => ({
      status: "ok" as const,
      service: config.serviceName,
      timestamp: new Date().toISOString(),
    }))
    .get("/ready", async () => ({
      status: "ready" as const,
      service: config.serviceName,
      checks: {
        controlPlaneStore: "ok",
      },
      store: await store.health(),
      timestamp: new Date().toISOString(),
    }))
    .get("/version", () => ({
      service: config.serviceName,
      version: config.version,
      environment: config.environment,
      storeMode: config.storeMode,
    }));
}
EOF

cat > services/control-api/src/routes/organizations.ts <<'EOF'
import { Elysia, t } from "elysia";
import { data, fail, list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createOrganizationRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia()
    .post(
      "/organizations",
      async ({ body, set }) => {
        const organization = await store.createOrganization(body);
        set.status = 201;

        return data(organization);
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          slug: t.Optional(t.String({ minLength: 1 })),
        }),
      },
    )
    .get("/organizations", async () => list(await store.listOrganizations()))
    .get("/organizations/:organizationId", async ({ params, set }) => {
      const organization = await store.getOrganization(params.organizationId);

      if (!organization) {
        return fail(
          set,
          404,
          "organization_not_found",
          `Organization not found: ${params.organizationId}`,
        );
      }

      return data(organization);
    });
}
EOF

cat > services/control-api/src/routes/projects.ts <<'EOF'
import { Elysia, t } from "elysia";
import { data, fail, list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

const environmentKeySchema = t.Union([
  t.Literal("local"),
  t.Literal("preview"),
  t.Literal("development"),
  t.Literal("staging"),
  t.Literal("production"),
]);

export function createProjectRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia()
    .post(
      "/projects",
      async ({ body, set }) => {
        const organization = await store.getOrganization(body.organizationId);

        if (!organization) {
          return fail(
            set,
            404,
            "organization_not_found",
            `Organization not found: ${body.organizationId}`,
          );
        }

        const project = await store.createProject(body);
        set.status = 201;

        return data(project);
      },
      {
        body: t.Object({
          organizationId: t.String({ minLength: 1 }),
          name: t.String({ minLength: 1 }),
          slug: t.Optional(t.String({ minLength: 1 })),
        }),
      },
    )
    .get(
      "/projects",
      async ({ query }) =>
        list(
          await store.listProjects({
            organizationId: query.organizationId,
          }),
        ),
      {
        query: t.Object({
          organizationId: t.Optional(t.String({ minLength: 1 })),
        }),
      },
    )
    .get("/projects/:projectId", async ({ params, set }) => {
      const project = await store.getProject(params.projectId);

      if (!project) {
        return fail(
          set,
          404,
          "project_not_found",
          `Project not found: ${params.projectId}`,
        );
      }

      return data(project);
    })
    .post(
      "/projects/:projectId/environments",
      async ({ body, params, set }) => {
        const project = await store.getProject(params.projectId);

        if (!project) {
          return fail(
            set,
            404,
            "project_not_found",
            `Project not found: ${params.projectId}`,
          );
        }

        const environment = await store.createProjectEnvironment({
          projectId: params.projectId,
          name: body.name,
          key: body.key,
        });

        set.status = 201;

        return data(environment);
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          key: t.Optional(environmentKeySchema),
        }),
      },
    )
    .get("/projects/:projectId/environments", async ({ params, set }) => {
      const project = await store.getProject(params.projectId);

      if (!project) {
        return fail(
          set,
          404,
          "project_not_found",
          `Project not found: ${params.projectId}`,
        );
      }

      return list(await store.listProjectEnvironments(params.projectId));
    });
}
EOF

cat > services/control-api/src/routes/environments.ts <<'EOF'
import { Elysia } from "elysia";
import { data, fail } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createEnvironmentRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia().get(
    "/environments/:environmentId",
    async ({ params, set }) => {
      const environment = await store.getEnvironment(params.environmentId);

      if (!environment) {
        return fail(
          set,
          404,
          "environment_not_found",
          `Environment not found: ${params.environmentId}`,
        );
      }

      return data(environment);
    },
  );
}
EOF

cat > services/control-api/src/routes/audit-events.ts <<'EOF'
import { Elysia, t } from "elysia";
import { list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

function parseLimit(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.min(Math.floor(parsed), 500);
}

export function createAuditEventRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia().get(
    "/audit-events",
    async ({ query }) =>
      list(
        await store.listAuditEvents({
          entityType: query.entityType,
          entityId: query.entityId,
          limit: parseLimit(query.limit),
        }),
      ),
    {
      query: t.Object({
        entityType: t.Optional(t.String({ minLength: 1 })),
        entityId: t.Optional(t.String({ minLength: 1 })),
        limit: t.Optional(t.String({ minLength: 1 })),
      }),
    },
  );
}
EOF

cat > services/control-api/src/app.ts <<'EOF'
import {
  type ControlApiConfig,
  loadControlApiConfig,
} from "@monad-backend/config";
import { Elysia } from "elysia";
import { createAuditEventRoutes } from "./routes/audit-events";
import { createEnvironmentRoutes } from "./routes/environments";
import { createHealthRoutes } from "./routes/health";
import { createOrganizationRoutes } from "./routes/organizations";
import { createProjectRoutes } from "./routes/projects";
import type { ControlPlaneStore } from "./state/control-plane-store";
import { createConfiguredControlPlaneStore } from "./state/configured-control-plane-store";

export interface ControlApiDependencies {
  readonly config?: ControlApiConfig;
  readonly store?: ControlPlaneStore;
}

export function createControlApiApp(
  dependencies: ControlApiDependencies = {},
): Elysia {
  const config = dependencies.config ?? loadControlApiConfig();
  const store =
    dependencies.store ?? createConfiguredControlPlaneStore(config);

  return new Elysia()
    .onError(({ code, error, set }) => {
      if (code === "VALIDATION") {
        set.status = 400;

        return {
          error: {
            code: "validation_error",
            message: "Request validation failed.",
            details: error.message,
          },
        };
      }

      console.error(error);
      set.status = 500;

      return {
        error: {
          code: "internal_server_error",
          message: "An unexpected Control API error occurred.",
        },
      };
    })
    .use(createHealthRoutes(config, store))
    .use(createOrganizationRoutes(store))
    .use(createProjectRoutes(store))
    .use(createEnvironmentRoutes(store))
    .use(createAuditEventRoutes(store));
}
EOF

cat > services/control-api/src/index.ts <<'EOF'
import { loadControlApiConfig } from "@monad-backend/config";
import { createControlApiApp } from "./app";
import { createConfiguredControlPlaneStore } from "./state/configured-control-plane-store";

const config = loadControlApiConfig();
const store = createConfiguredControlPlaneStore(config);
const app = createControlApiApp({ config, store });

app.listen({
  hostname: config.hostname,
  port: config.port,
});

console.log(
  `[${config.serviceName}] listening on ${config.publicBaseUrl} in ${config.environment} mode using ${config.storeMode} store`,
);
EOF

cat > services/control-api/src/scripts/check-database.ts <<'EOF'
import { loadControlApiConfig } from "@monad-backend/config";
import {
  createControlPlaneSql,
  createPostgresControlPlaneRepository,
  validateControlPlaneSchema,
} from "@monad-backend/database";

const config = loadControlApiConfig({
  ...Bun.env,
  CONTROL_API_STORE_MODE: "database",
});

if (!config.database.url) {
  console.error(
    "CONTROL_PLANE_DATABASE_URL or DATABASE_URL is required for control-api:db:check.",
  );
  console.error("");
  console.error("For local Supabase, try:");
  console.error(
    "CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres bun run control-api:db:check",
  );
  process.exit(1);
}

const sql = createControlPlaneSql({
  url: config.database.url,
  maxConnections: 1,
});

try {
  const schemaResult = await validateControlPlaneSchema(
    sql,
    config.database.schema,
  );

  if (!schemaResult.ok) {
    console.error("Control-plane database schema validation failed.");
    console.error("");
    console.error("Missing required columns:");

    for (const missing of schemaResult.missing) {
      console.error(`  - ${missing}`);
    }

    process.exit(1);
  }

  const repository = createPostgresControlPlaneRepository({
    url: config.database.url,
    schema: config.database.schema,
    maxConnections: 1,
  });

  try {
    const health = await repository.health();

    console.log("Control-plane database schema validation passed.");
    console.log(
      JSON.stringify(
        {
          schema: config.database.schema,
          health,
        },
        null,
        2,
      ),
    );
  } finally {
    await repository.close();
  }
} finally {
  await sql.end({ timeout: 5 });
}
EOF

cat > services/control-api/.env.example <<'EOF'
CONTROL_API_ENV=local
CONTROL_API_HOST=127.0.0.1
CONTROL_API_PORT=4310
CONTROL_API_PUBLIC_BASE_URL=http://127.0.0.1:4310
CONTROL_API_LOG_LEVEL=info
CONTROL_API_VERSION=0.1.0

# memory is the safe local default.
# database enables the PostgreSQL-backed control-plane store.
CONTROL_API_STORE_MODE=memory

# Local Supabase default.
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
CONTROL_PLANE_DATABASE_SCHEMA=platform
CONTROL_PLANE_DATABASE_MAX=5
EOF

cat > services/control-api/README.md <<'EOF'
# Control API

The Control API is the first platform service for Open Backend Cloud.

It owns the initial HTTP boundary for the platform control plane.

## Current Scope

This service is intentionally small but runnable.

It currently exposes:

- `GET /health`
- `GET /ready`
- `GET /version`
- `POST /organizations`
- `GET /organizations`
- `GET /organizations/:organizationId`
- `POST /projects`
- `GET /projects`
- `GET /projects/:projectId`
- `POST /projects/:projectId/environments`
- `GET /projects/:projectId/environments`
- `GET /environments/:environmentId`
- `GET /audit-events`

## Store Modes

The Control API supports two store modes.

### `memory`

Default.

Useful for route tests, smoke tests, local API shape work, and development when Supabase/Postgres is not running.

```bash
CONTROL_API_STORE_MODE=memory bun run control-api:dev
```

### `database`

Uses the `platform` schema in PostgreSQL.

```bash
CONTROL_API_STORE_MODE=database \
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:dev
```

## What It Does Not Do Yet

It does not yet provision real Supabase runtimes.

It does not yet authenticate requests.

It does not yet enforce authorization.

It does not yet manage secrets, backups, deployments, or quotas.

Those will come in later work packets.

## Development

From the repo root:

```bash
bun run control-api:dev
```

Then open:

```text
http://127.0.0.1:4310/health
```

## Validation

From the repo root:

```bash
bun run control-api:check
```

## Database Validation

With local Supabase running and reset:

```bash
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:db:check
```

EOF

cat > docs/database/control-api-persistence-boundary.md <<'EOF'

# Control API Persistence Boundary

## Purpose

WP-0005 adds the first database-backed persistence boundary for the Control API.

The goal is not to overbuild the data-access layer.

The goal is to keep HTTP routes stable while allowing the backing store to switch from in-memory to PostgreSQL.

## Store Modes

The Control API supports two store modes.

### Memory Store

The memory store is used for:

* route tests
* local API shape work
* development without a running database
* fast feedback

It is not durable.

### Database Store

The database store is used for:

* integration with the `platform` schema
* durable organizations
* durable projects
* durable environments
* durable audit events
* future management API behavior

## Configuration

```text
CONTROL_API_STORE_MODE=database
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
CONTROL_PLANE_DATABASE_SCHEMA=platform
CONTROL_PLANE_DATABASE_MAX=5
```

## Boundary Rule

Routes should depend on the `ControlPlaneStore` interface.

Routes should not contain SQL.

SQL belongs in `packages/database`.

## Current Database Tables Used

WP-0005 currently uses:

* `platform.organizations`
* `platform.projects`
* `platform.project_environments`
* `platform.audit_events`

Later work packets will add database access for:

* runtime instances
* runtime services
* deployments
* deployment events
* secrets metadata
* backup plans
* backups
* restore jobs
* usage events
* quota limits
* API keys
* webhooks

## Validation

The schema check validates the required tables and columns for the current API skeleton.

```bash
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:db:check
```

## Design Doctrine

* Keep HTTP route code thin.
* Keep SQL outside the service route layer.
* Keep the in-memory store for fast tests.
* Make database mode explicit.
* Do not add provisioning behavior yet.
* Do not expose admin actions without audit events.
  EOF

cat > docs/work-packets/WP-0005-control-api-database-adapter-and-persistence-boundary.md <<'EOF'

# WP-0005: Control API Database Adapter and Persistence Boundary

## Epic

Control Plane Foundation

## Objective

Add a PostgreSQL-backed persistence boundary for the Control API while preserving the existing route-level service boundary.

## Scope

This work packet adds:

* database-backed control-plane repository
* configurable Control API store mode
* PostgreSQL schema validation command
* database health/readiness support
* Control API docs for persistence
* package boundary between `services/control-api` and `packages/database`

## Explicit Non-Scope

This work packet does not add:

* authentication
* authorization
* provisioning
* backup orchestration
* secret management
* admin dashboard
* CLI
* pagination
* idempotency keys
* OpenTelemetry instrumentation
* database transaction unit-of-work abstraction

## Store Modes

```text
CONTROL_API_STORE_MODE=memory
CONTROL_API_STORE_MODE=database
```

`memory` remains the default.

`database` requires:

```text
CONTROL_PLANE_DATABASE_URL
```

## Acceptance Criteria

```text
The Control API still runs with the memory store.
The Control API can be configured to use the database store.
The database store lives behind the same ControlPlaneStore interface.
Route handlers do not contain SQL.
SQL access lives in packages/database.
A schema validation command exists.
bun run control-api:check passes without requiring Supabase.
bun run control-api:db:check validates the platform schema when Supabase is running.
Docs explain the persistence boundary.
```

## Validation Commands

Always run:

```bash
bun install
bun run control-api:check
bun run check
```

When Supabase is running:

```bash
bun run supabase:start
bun run supabase:reset
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:db:check
```

## Commit Message

```text
feat: add control api database adapter
```

EOF

python3 - <<'PY'
from pathlib import Path

index = Path("docs/00-index.md")

if index.exists():
text = index.read_text()
else:
text = "# Documentation Index\n"

sections = {
"## Database": [
"- [Control API Persistence Boundary](database/control-api-persistence-boundary.md)",
],
"## Work Packets": [
"- [WP-0005: Control API Database Adapter and Persistence Boundary](work-packets/WP-0005-control-api-database-adapter-and-persistence-boundary.md)",
],
}

for section, lines in sections.items():
if section not in text:
text += f"\n{section}\n\n"

```
for line in lines:
    if line not in text:
        text = text.replace(f"{section}\n\n", f"{section}\n\n{line}\n")
```

index.write_text(text)
PY

echo
echo "Installing dependencies..."
bun install

echo
echo "Running package and Control API validation..."
bun run check:wp0005

echo
echo "Running full workspace validation..."
bun run check

echo
echo "Git status:"
git status --short

git add .

if git diff --cached --quiet; then
echo "No changes to commit."
else
git commit -m "feat: add control api database adapter"
fi

echo
echo "WP-0005 complete."
echo
echo "Optional database validation, after Supabase is running:"
echo "  bun run supabase:start"
echo "  bun run supabase:reset"
echo "  CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres bun run control-api:db:check"
echo
echo "Run Control API in memory mode:"
echo "  bun run control-api:dev"
echo
echo "Run Control API in database mode:"
echo "  CONTROL_API_STORE_MODE=database CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres bun run control-api:dev"
