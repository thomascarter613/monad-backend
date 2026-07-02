import type { ControlApiConfig } from "@monad-backend/config";
import { Elysia, t } from "elysia";
import { requireControlApiAuth } from "../auth/control-api-authenticator";
import type { ControlApiAuthenticator } from "../auth/control-api-authenticator";
import { data, fail, list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

const environmentKeySchema = t.Union([
  t.Literal("local"),
  t.Literal("preview"),
  t.Literal("development"),
  t.Literal("staging"),
  t.Literal("production"),
]);

export function createProjectRoutes(
  config: ControlApiConfig,
  store: ControlPlaneStore,
  authenticator: ControlApiAuthenticator,
): Elysia {
  return new Elysia()
    .post(
      "/projects",
      async ({ body, request, set }) => {
        const auth = await requireControlApiAuth({
          request,
          set,
          config,
          authenticator,
          requiredScope: "projects:write",
        });

        if (!auth.ok) {
          return auth.response;
        }

        const organization = await store.getOrganization(body.organizationId);

        if (!organization) {
          return fail(
            set,
            404,
            "organization_not_found",
            `Organization not found: ${body.organizationId}`,
          );
        }

        const project = await store.createProject(body, {
          actor: auth.principal,
        });
        set.status = 201;

        return data(project);
      },
      {
        body: t.Object({
          organizationId: t.String({ minLength: 1 }),
          name: t.String({ minLength: 1 }),
          slug: t.Optional(t.String({ minLength: 1 })),
        }),
      },
    )
    .get(
      "/projects",
      async ({ query, request, set }) => {
        const auth = await requireControlApiAuth({
          request,
          set,
          config,
          authenticator,
          requiredScope: "projects:read",
        });

        if (!auth.ok) {
          return auth.response;
        }

        return list(
          await store.listProjects({
            organizationId: query.organizationId,
          }),
        );
      },
      {
        query: t.Object({
          organizationId: t.Optional(t.String({ minLength: 1 })),
        }),
      },
    )
    .get("/projects/:projectId", async ({ params, request, set }) => {
      const auth = await requireControlApiAuth({
        request,
        set,
        config,
        authenticator,
        requiredScope: "projects:read",
      });

      if (!auth.ok) {
        return auth.response;
      }

      const project = await store.getProject(params.projectId);

      if (!project) {
        return fail(
          set,
          404,
          "project_not_found",
          `Project not found: ${params.projectId}`,
        );
      }

      return data(project);
    })
    .post(
      "/projects/:projectId/environments",
      async ({ body, params, request, set }) => {
        const auth = await requireControlApiAuth({
          request,
          set,
          config,
          authenticator,
          requiredScope: "environments:write",
        });

        if (!auth.ok) {
          return auth.response;
        }

        const project = await store.getProject(params.projectId);

        if (!project) {
          return fail(
            set,
            404,
            "project_not_found",
            `Project not found: ${params.projectId}`,
          );
        }

        const environment = await store.createProjectEnvironment(
          {
            projectId: params.projectId,
            name: body.name,
            key: body.key,
          },
          {
            actor: auth.principal,
          },
        );

        set.status = 201;

        return data(environment);
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          key: t.Optional(environmentKeySchema),
        }),
      },
    )
    .get("/projects/:projectId/environments", async ({ params, request, set }) => {
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

      const project = await store.getProject(params.projectId);

      if (!project) {
        return fail(
          set,
          404,
          "project_not_found",
          `Project not found: ${params.projectId}`,
        );
      }

      return list(await store.listProjectEnvironments(params.projectId));
    });
}
