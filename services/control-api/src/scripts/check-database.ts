import { loadControlApiConfig } from "@monad-backend/config";
import {
  createApiKeySql,
  createControlPlaneSql,
  createPostgresControlPlaneRepository,
  validateApiKeySchema,
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

const controlPlaneSql = createControlPlaneSql({
  url: config.database.url,
  maxConnections: 1,
});

const apiKeySql = createApiKeySql({
  url: config.database.url,
  maxConnections: 1,
});

try {
  const schemaResult = await validateControlPlaneSchema(
    controlPlaneSql,
    config.database.schema,
  );

  const apiKeySchemaResult = await validateApiKeySchema(
    apiKeySql,
    config.database.schema,
  );

  const missing = [...schemaResult.missing, ...apiKeySchemaResult.missing];

  if (missing.length > 0) {
    console.error("Control-plane database schema validation failed.");
    console.error("");
    console.error("Missing required columns:");

    for (const item of missing) {
      console.error(`  - ${item}`);
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
          apiKeySchema: "ok",
        },
        null,
        2,
      ),
    );
  } finally {
    await repository.close();
  }
} finally {
  await controlPlaneSql.end({ timeout: 5 });
  await apiKeySql.end({ timeout: 5 });
}
