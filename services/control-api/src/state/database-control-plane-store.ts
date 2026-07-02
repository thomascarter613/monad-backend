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
