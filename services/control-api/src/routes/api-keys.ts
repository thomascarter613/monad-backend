import type { ApiKeyScope } from "@monad-backend/auth";
import type { ControlApiConfig } from "@monad-backend/config";
import { Elysia, t } from "elysia";
import { requireControlApiAuth } from "../auth/control-api-authenticator";
import type { ControlApiAuthenticator } from "../auth/control-api-authenticator";
import { data, fail, list } from "../http/response";
import type {
  ApiKeyStatus,
  ControlPlaneStore,
} from "../state/control-plane-store";

const apiKeyScopeSchema = t.Union([
  t.Literal("*"),
  t.Literal("management:*"),
  t.Literal("api_keys:read"),
  t.Literal("api_keys:write"),
  t.Literal("organizations:read"),
  t.Literal("organizations:write"),
  t.Literal("projects:read"),
  t.Literal("projects:write"),
  t.Literal("environments:read"),
  t.Literal("environments:write"),
  t.Literal("audit:read"),
]);

const apiKeyStatusSchema = t.Union([
  t.Literal("active"),
  t.Literal("disabled"),
  t.Literal("revoked"),
]);

export function createApiKeyRoutes(
  config: ControlApiConfig,
  store: ControlPlaneStore,
  authenticator: ControlApiAuthenticator,
): Elysia {
  return new Elysia()
    .post(
      "/api-keys",
      async ({ body, request, set }) => {
        const auth = await requireControlApiAuth({
          request,
          set,
          config,
          authenticator,
          requiredScope: "api_keys:write",
        });

        if (!auth.ok) {
          return auth.response;
        }

        if (body.organizationId) {
          const organization = await store.getOrganization(body.organizationId);

          if (!organization) {
            return fail(
              set,
              404,
              "organization_not_found",
              `Organization not found: ${body.organizationId}`,
            );
          }
        }

        const created = await store.createApiKey(
          {
            organizationId: body.organizationId,
            name: body.name,
            scopes: body.scopes as ApiKeyScope[] | undefined,
            expiresAt: body.expiresAt,
          },
          {
            actor: auth.principal,
          },
        );

        set.status = 201;

        return data(created);
      },
      {
        body: t.Object({
          organizationId: t.Optional(t.String({ minLength: 1 })),
          name: t.String({ minLength: 1 }),
          scopes: t.Optional(t.Array(apiKeyScopeSchema)),
          expiresAt: t.Optional(t.Union([t.String(), t.Null()])),
        }),
      },
    )
    .get(
      "/api-keys",
      async ({ query, request, set }) => {
        const auth = await requireControlApiAuth({
          request,
          set,
          config,
          authenticator,
          requiredScope: "api_keys:read",
        });

        if (!auth.ok) {
          return auth.response;
        }

        return list(
          await store.listApiKeys({
            organizationId: query.organizationId,
            status: query.status as ApiKeyStatus | undefined,
          }),
        );
      },
      {
        query: t.Object({
          organizationId: t.Optional(t.String({ minLength: 1 })),
          status: t.Optional(apiKeyStatusSchema),
        }),
      },
    )
    .post("/api-keys/:apiKeyId/revoke", async ({ params, request, set }) => {
      const auth = await requireControlApiAuth({
        request,
        set,
        config,
        authenticator,
        requiredScope: "api_keys:write",
      });

      if (!auth.ok) {
        return auth.response;
      }

      const revoked = await store.revokeApiKey(
        {
          apiKeyId: params.apiKeyId,
        },
        {
          actor: auth.principal,
        },
      );

      if (!revoked) {
        return fail(
          set,
          404,
          "api_key_not_found",
          `API key not found: ${params.apiKeyId}`,
        );
      }

      return data(revoked);
    })
    .post(
      "/api-keys/:apiKeyId/rotate",
      async ({ body, params, request, set }) => {
        const auth = await requireControlApiAuth({
          request,
          set,
          config,
          authenticator,
          requiredScope: "api_keys:write",
        });

        if (!auth.ok) {
          return auth.response;
        }

        const rotated = await store.rotateApiKey(
          {
            apiKeyId: params.apiKeyId,
            expiresAt: body.expiresAt,
          },
          {
            actor: auth.principal,
          },
        );

        if (!rotated) {
          return fail(
            set,
            404,
            "api_key_not_found",
            `API key not found: ${params.apiKeyId}`,
          );
        }

        return data(rotated);
      },
      {
        body: t.Object({
          expiresAt: t.Optional(t.Union([t.String(), t.Null()])),
        }),
      },
    );
}
