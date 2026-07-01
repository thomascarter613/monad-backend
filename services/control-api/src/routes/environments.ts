import { Elysia } from "elysia";
import { data, fail } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createEnvironmentRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia().get(
    "/environments/:environmentId",
    async ({ params, set }) => {
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
