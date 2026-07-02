import {
  type ControlApiConfig,
  loadControlApiConfig,
} from "@monad-backend/config";
import { Elysia } from "elysia";
import {
  type ControlApiAuthenticator,
  createConfiguredControlApiAuthenticator,
} from "./auth/control-api-authenticator";
import { createApiKeyRoutes } from "./routes/api-keys";
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
  readonly authenticator?: ControlApiAuthenticator;
}

export function createControlApiApp(
  dependencies: ControlApiDependencies = {},
): Elysia {
  const config = dependencies.config ?? loadControlApiConfig();
  const store =
    dependencies.store ?? createConfiguredControlPlaneStore(config);
  const authenticator =
    dependencies.authenticator ?? createConfiguredControlApiAuthenticator(config);

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
    .use(createHealthRoutes(config, store, authenticator))
    .use(createApiKeyRoutes(config, store, authenticator))
    .use(createOrganizationRoutes(config, store, authenticator))
    .use(createProjectRoutes(config, store, authenticator))
    .use(createEnvironmentRoutes(config, store, authenticator))
    .use(createAuditEventRoutes(config, store, authenticator));
}
