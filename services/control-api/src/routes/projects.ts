import { Elysia, t } from "elysia";
import { data, fail, list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

const environmentKeySchema = t.Union([
  t.Literal("local"),
  t.Literal("preview"),
  t.Literal("development"),
  t.Literal("staging"),
  t.Literal("production"),
]);

export function createProjectRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia()
    .post(
      "/projects",
      async ({ body, set }) => {
        const organization = await store.getOrganization(body.organizationId);

        if (!organization) {
          return fail(
            set,
            404,
            "organization_not_found",
            `Organization not found: ${body.organizationId}`,
          );
        }

        const project = await store.createProject(body);
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
      async ({ query }) =>
        list(
          await store.listProjects({
            organizationId: query.organizationId,
          }),
        ),
      {
        query: t.Object({
          organizationId: t.Optional(t.String({ minLength: 1 })),
        }),
      },
    )
    .get("/projects/:projectId", async ({ params, set }) => {
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
      async ({ body, params, set }) => {
        const project = await store.getProject(params.projectId);

        if (!project) {
          return fail(
            set,
            404,
            "project_not_found",
            `Project not found: ${params.projectId}`,
          );
        }

        const environment = await store.createProjectEnvironment({
          projectId: params.projectId,
          name: body.name,
          key: body.key,
        });

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
    .get("/projects/:projectId/environments", async ({ params, set }) => {
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
