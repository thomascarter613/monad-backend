import { Elysia, t } from "elysia";
import { data, fail, list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

export function createOrganizationRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia()
    .post(
      "/organizations",
      async ({ body, set }) => {
        const organization = await store.createOrganization(body);
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
    .get("/organizations", async () => list(await store.listOrganizations()))
    .get("/organizations/:organizationId", async ({ params, set }) => {
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
