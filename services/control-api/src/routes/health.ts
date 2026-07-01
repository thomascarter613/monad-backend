import type { ControlApiConfig } from "@open-backend-cloud/config";
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
    .get("/ready", () => ({
      status: "ready" as const,
      service: config.serviceName,
      checks: {
        controlPlaneStore: "ok",
      },
      store: store.health(),
      timestamp: new Date().toISOString(),
    }))
    .get("/version", () => ({
      service: config.serviceName,
      version: config.version,
      environment: config.environment,
    }));
}
