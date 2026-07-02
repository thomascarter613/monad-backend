import type { ControlApiConfig } from "@monad-backend/config";
import { Elysia } from "elysia";
import { requireControlApiAuth } from "../auth/control-api-authenticator";
import type { ControlApiAuthenticator } from "../auth/control-api-authenticator";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createHealthRoutes(
  config: ControlApiConfig,
  store: ControlPlaneStore,
  authenticator: ControlApiAuthenticator,
): Elysia {
  return new Elysia()
    .get("/health", () => ({
      status: "ok" as const,
      service: config.serviceName,
      timestamp: new Date().toISOString(),
    }))
    .get("/ready", async ({ request, set }) => {
      const auth = await requireControlApiAuth({
        request,
        set,
        config,
        authenticator,
        requiredScope: "management:*",
      });

      if (!auth.ok) {
        return auth.response;
      }

      return {
        status: "ready" as const,
        service: config.serviceName,
        checks: {
          controlPlaneStore: "ok",
        },
        store: await store.health(),
        timestamp: new Date().toISOString(),
      };
    })
    .get("/version", () => ({
      service: config.serviceName,
      version: config.version,
      environment: config.environment,
      storeMode: config.storeMode,
      authMode: config.auth.mode,
    }));
}
