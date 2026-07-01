import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "package.json",
  "tsconfig.json",
  "biome.json",
  "lefthook.yml",
  ".editorconfig",
  ".gitignore",
  ".env.example",
  "docs/00-index.md",
  "docs/product/product-charter.md",
  "docs/product/v1-scope.md",
  "docs/architecture/overview.md",
  "docs/architecture/control-plane-runtime-plane.md",
  "docs/architecture/adr/0001-use-supabase-oss-as-runtime-plane.md",
  "docs/architecture/adr/0002-build-foss-control-plane-around-supabase.md",
  "docs/architecture/adr/0003-use-postgres-for-control-plane-state.md",
  "docs/architecture/adr/0004-use-gitops-for-runtime-deployment.md",
  "docs/development/local-supabase-runtime.md",
  "docs/work-packets/WP-0002-monorepo-tooling-and-local-supabase-runtime.md",
  "docs/work-packets/WP-0003-control-plane-data-model-and-database-package.md",
  "docs/architecture/control-plane-data-model.md",
  "docs/database/control-plane-schema.md",
  "supabase/config.toml",
  "supabase/seed.sql",
  "supabase/migrations/20260701210000_init_runtime_foundation.sql",
  "supabase/migrations/20260701213000_init_control_plane_schema.sql",
  "supabase/tests/00_foundation.pgtap.sql",
  "supabase/tests/01_control_plane_schema.pgtap.sql",
  "packages/config/src/index.ts",
  "packages/database/src/index.ts",
  "packages/database/src/control-plane.ts",
  "packages/domain/src/index.ts",
  "packages/domain/src/control-plane.ts",
  "packages/events/src/index.ts",
  "packages/events/src/control-plane-events.ts",
  "packages/sdk/src/index.ts",
];

const requiredScripts = [
  "format",
  "lint",
  "typecheck",
  "test",
  "check",
  "docs:check",
  "foundation:check",
  "supabase:start",
  "supabase:stop",
  "supabase:status",
  "supabase:reset",
  "supabase:test",
  "supabase:types",
  "dev:runtime",
  "verify:runtime",
  "control-plane:check",
];

const failures: string[] = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    failures.push(`Missing required file: ${file}`);
  }
}

const packageJsonPath = join(root, "package.json");

if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
    workspaces?: string[];
  };

  for (const script of requiredScripts) {
    if (!packageJson.scripts?.[script]) {
      failures.push(`Missing package script: ${script}`);
    }
  }

  const expectedWorkspaces = ["apps/*", "services/*", "packages/*"];

  for (const workspace of expectedWorkspaces) {
    if (!packageJson.workspaces?.includes(workspace)) {
      failures.push(`Missing workspace pattern: ${workspace}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Foundation check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Foundation check passed.");
