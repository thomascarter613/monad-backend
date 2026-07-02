import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type ControlApiAuthMode = "disabled" | "static" | "database";

export type ApiKeyScope =
  | "*"
  | "management:*"
  | "api_keys:read"
  | "api_keys:write"
  | "organizations:read"
  | "organizations:write"
  | "projects:read"
  | "projects:write"
  | "environments:read"
  | "environments:write"
  | "audit:read";

export interface ApiKeyPrincipal {
  readonly actorType: "system" | "api_key";
  readonly actorId: string | null;
  readonly organizationId: string | null;
  readonly apiKeyId: string | null;
  readonly name: string;
  readonly scopes: readonly ApiKeyScope[];
}

export interface ApiKeyHashResult {
  readonly hash: string;
  readonly prefix: string;
}

export interface GeneratedApiKey {
  readonly apiKey: string;
  readonly hash: string;
  readonly prefix: string;
}

export function generateApiKey(prefix = "obc"): GeneratedApiKey {
  const apiKey = `${prefix}_${randomBytes(32).toString("base64url")}`;
  const result = hashApiKey(apiKey);

  return {
    apiKey,
    hash: result.hash,
    prefix: result.prefix,
  };
}

export function hashApiKey(apiKey: string): ApiKeyHashResult {
  const normalized = apiKey.trim();

  if (normalized.length < 12) {
    throw new Error("API keys must be at least 12 characters long.");
  }

  return {
    hash: createHash("sha256").update(normalized).digest("hex"),
    prefix: normalized.slice(0, Math.min(12, normalized.length)),
  };
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function hasRequiredScope(
  principal: ApiKeyPrincipal,
  requiredScope: ApiKeyScope,
): boolean {
  return (
    principal.scopes.includes("*") ||
    principal.scopes.includes("management:*") ||
    principal.scopes.includes(requiredScope)
  );
}

export function extractApiKeyFromRequest(
  request: Request,
  headerName = "x-control-api-key",
): string | undefined {
  const configuredHeader = request.headers.get(headerName);

  if (configuredHeader && configuredHeader.trim().length > 0) {
    return configuredHeader.trim();
  }

  const genericHeader = request.headers.get("x-api-key");

  if (genericHeader && genericHeader.trim().length > 0) {
    return genericHeader.trim();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return undefined;
  }

  const [scheme, ...rest] = authorization.trim().split(/\s+/u);

  if (scheme?.toLowerCase() !== "bearer") {
    return undefined;
  }

  const token = rest.join(" ").trim();

  return token.length > 0 ? token : undefined;
}
