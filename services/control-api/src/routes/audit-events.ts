import type { ControlApiConfig } from "@monad-backend/config";
import { Elysia, t } from "elysia";
import { requireControlApiAuth } from "../auth/control-api-authenticator";
import type { ControlApiAuthenticator } from "../auth/control-api-authenticator";
import { list } from "../http/response";
import type { ControlPlaneStore } from "../state/control-plane-store";

function parseLimit(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.min(Math.floor(parsed), 500);
}

export function createAuditEventRoutes(
  config: ControlApiConfig,
  store: ControlPlaneStore,
  authenticator: ControlApiAuthenticator,
): Elysia {
  return new Elysia().get(
    "/audit-events",
    async ({ query, request, set }) => {
      const auth = await requireControlApiAuth({
        request,
        set,
        config,
        authenticator,
        requiredScope: "audit:read",
      });

      if (!auth.ok) {
        return auth.response;
      }

      return list(
        await store.listAuditEvents({
          entityType: query.entityType,
          entityId: query.entityId,
          limit: parseLimit(query.limit),
        }),
      );
    },
    {
      query: t.Object({
        entityType: t.Optional(t.String({ minLength: 1 })),
        entityId: t.Optional(t.String({ minLength: 1 })),
        limit: t.Optional(t.String({ minLength: 1 })),
      }),
    },
  );
}
