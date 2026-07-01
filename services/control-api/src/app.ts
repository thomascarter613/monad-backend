import {
  type ControlApiConfig,
  loadControlApiConfig,
} from "@open-backend-cloud/config";
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
