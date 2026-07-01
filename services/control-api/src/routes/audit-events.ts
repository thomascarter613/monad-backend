import { Elysia, t } from "elysia";
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

export function createAuditEventRoutes(store: ControlPlaneStore): Elysia {
  return new Elysia().get(
    "/audit-events",
    ({ query }) =>
      list(
        store.listAuditEvents({
          entityType: query.entityType,
          entityId: query.entityId,
          limit: parseLimit(query.limit),
        }),
      ),
    {
      query: t.Object({
        entityType: t.Optional(t.String({ minLength: 1 })),
        entityId: t.Optional(t.String({ minLength: 1 })),
        limit: t.Optional(t.String({ minLength: 1 })),
      }),
    },
  );
}
