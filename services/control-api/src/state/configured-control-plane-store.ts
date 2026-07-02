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
