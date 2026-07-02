import type { ControlApiConfig } from "@monad-backend/config";
import { Elysia, t } from "elysia";
import { requireControlApiAuth } from "../auth/control-api-authenticator";
import type { ControlApiAuthenticator } from "../auth/control-api-authenticator";
import { data, fail, list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createOrganizationRoutes(
  config: ControlApiConfig,
  store: ControlPlaneStore,
  authenticator: ControlApiAuthenticator,
): Elysia {
  return new Elysia()
    .post(
      "/organizations",
      async ({ body, request, set }) => {
        const auth = await requireControlApiAuth({
          request,
          set,
          config,
          authenticator,
          requiredScope: "organizations:write",
        });

        if (!auth.ok) {
          return auth.response;
        }

        const organization = await store.createOrganization(body, {
          actor: auth.principal,
        });
        set.status = 201;

        return data(organization);
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          slug: t.Optional(t.String({ minLength: 1 })),
        }),
      },
    )
    .get("/organizations", async ({ request, set }) => {
      const auth = await requireControlApiAuth({
        request,
        set,
        config,
        authenticator,
        requiredScope: "organizations:read",
      });

      if (!auth.ok) {
        return auth.response;
      }

      return list(await store.listOrganizations());
    })
    .get("/organizations/:organizationId", async ({ params, request, set }) => {
      const auth = await requireControlApiAuth({
        request,
        set,
        config,
        authenticator,
        requiredScope: "organizations:read",
      });

      if (!auth.ok) {
        return auth.response;
      }

      const organization = await store.getOrganization(params.organizationId);

      if (!organization) {
        return fail(
          set,
          404,
          "organization_not_found",
          `Organization not found: ${params.organizationId}`,
        );
      }

      return data(organization);
    });
}
