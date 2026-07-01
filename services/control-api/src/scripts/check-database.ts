import { loadControlApiConfig } from "@open-backend-cloud/config";
import {
  createControlPlaneSql,
  createPostgresControlPlaneRepository,
  validateControlPlaneSchema,
} from "@open-backend-cloud/database";

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
