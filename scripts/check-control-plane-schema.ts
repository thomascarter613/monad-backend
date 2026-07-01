import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationPath = join(
  root,
  "supabase/migrations/20260701213000_init_control_plane_schema.sql",
);
const packagePath = join(root, "packages/database/src/control-plane.ts");

const requiredTables = [
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
];

const requiredEnums = [
  "organization_role",
  "environment_kind",
  "environment_status",
  "runtime_status",
  "runtime_service_status",
  "deployment_status",
  "backup_status",
  "restore_status",
  "secret_provider",
  "audit_actor_type",
  "webhook_status",
  "quota_period",
];

const failures: string[] = [];

if (!existsSync(migrationPath)) {
  failures.push(`Missing control-plane migration: ${migrationPath}`);
}

if (!existsSync(packagePath)) {
  failures.push(`Missing control-plane database package file: ${packagePath}`);
}

const migration = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";
const packageSource = existsSync(packagePath) ? readFileSync(packagePath, "utf8") : "";

for (const table of requiredTables) {
  const createPattern = new RegExp(`create\\s+table\\s+platform\\.${table}\\s*\\(`, "i");
  if (!createPattern.test(migration)) {
    failures.push(`Missing platform table in SQL migration: ${table}`);
  }

  if (!packageSource.includes(`"${table}"`)) {
    failures.push(`Missing table constant in database package: ${table}`);
  }
}

for (const enumName of requiredEnums) {
  const enumPattern = new RegExp(`create\\s+type\\s+platform\\.${enumName}\\s+as\\s+enum`, "i");
  if (!enumPattern.test(migration)) {
    failures.push(`Missing platform enum in SQL migration: ${enumName}`);
  }
}

if (!/alter\s+table\s+platform\.audit_events\s+enable\s+row\s+level\s+security/i.test(migration)) {
  failures.push("audit_events must have row level security enabled");
}

if (!/external_ref\s+text\s+not\s+null/i.test(migration)) {
  failures.push("secrets must store external secret references, not raw secret values");
}

if (failures.length > 0) {
  console.error("Control-plane schema check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Control-plane schema check passed.");
