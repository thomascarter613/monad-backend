import type { ControlApiConfig } from "@monad-backend/config";
import { Elysia } from "elysia";
import { requireControlApiAuth } from "../auth/control-api-authenticator";
import type { ControlApiAuthenticator } from "../auth/control-api-authenticator";
import { data, fail } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createEnvironmentRoutes(
  config: ControlApiConfig,
  store: ControlPlaneStore,
  authenticator: ControlApiAuthenticator,
): Elysia {
  return new Elysia().get(
    "/environments/:environmentId",
    async ({ params, request, set }) => {
      const auth = await requireControlApiAuth({
        request,
        set,
        config,
        authenticator,
        requiredScope: "environments:read",
      });

      if (!auth.ok) {
        return auth.response;
      }

      const environment = await store.getEnvironment(params.environmentId);

      if (!environment) {
        return fail(
          set,
          404,
          "environment_not_found",
          `Environment not found: ${params.environmentId}`,
        );
      }

      return data(environment);
    },
  );
}
