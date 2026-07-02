import {
  type ApiKeyPrincipal,
  type ApiKeyScope,
  extractApiKeyFromRequest,
  hashApiKey,
  hasRequiredScope,
  safeEqual,
} from "@monad-backend/auth";
import type { ControlApiConfig } from "@monad-backend/config";
import { createPostgresApiKeyRepository } from "@monad-backend/database";
import { fail } from "../http/response";

export interface ControlApiAuthenticator {
  readonly mode: "disabled" | "static" | "database";
  authenticate(apiKey: string | undefined): Promise<ApiKeyPrincipal | undefined>;
}

export class DisabledControlApiAuthenticator implements ControlApiAuthenticator {
  readonly mode = "disabled" as const;

  async authenticate(): Promise<ApiKeyPrincipal> {
    return {
      actorType: "system",
      actorId: null,
      organizationId: null,
      apiKeyId: null,
      name: "disabled-auth-test-principal",
      scopes: ["*"],
    };
  }
}

export class StaticControlApiAuthenticator implements ControlApiAuthenticator {
  readonly mode = "static" as const;

  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (apiKey.trim().length < 12) {
      throw new Error(
        "CONTROL_API_DEV_API_KEY must be at least 12 characters long when static auth is enabled.",
      );
    }

    this.apiKey = apiKey.trim();
  }

  async authenticate(
    apiKey: string | undefined,
  ): Promise<ApiKeyPrincipal | undefined> {
    if (!apiKey || !safeEqual(apiKey, this.apiKey)) {
      return undefined;
    }

    return {
      actorType: "api_key",
      actorId: "static-dev-api-key",
      organizationId: null,
      apiKeyId: "static-dev-api-key",
      name: "static-dev-api-key",
      scopes: ["management:*"],
    };
  }
}

export class DatabaseControlApiAuthenticator implements ControlApiAuthenticator {
  readonly mode = "database" as const;

  private readonly repository: ReturnType<typeof createPostgresApiKeyRepository>;

  constructor(config: ControlApiConfig) {
    if (!config.database.url) {
      throw new Error(
        "CONTROL_PLANE_DATABASE_URL or DATABASE_URL is required when CONTROL_API_AUTH_MODE=database.",
      );
    }

    this.repository = createPostgresApiKeyRepository({
      url: config.database.url,
      schema: config.database.schema,
      maxConnections: config.database.maxConnections,
    });
  }

  async authenticate(
    apiKey: string | undefined,
  ): Promise<ApiKeyPrincipal | undefined> {
    if (!apiKey) {
      return undefined;
    }

    const { hash } = hashApiKey(apiKey);
    const result = await this.repository.findActivePrincipalByHash(hash);

    return result?.principal;
  }
}

export function createConfiguredControlApiAuthenticator(
  config: ControlApiConfig,
): ControlApiAuthenticator {
  if (config.auth.mode === "disabled") {
    return new DisabledControlApiAuthenticator();
  }

  if (config.auth.mode === "database") {
    return new DatabaseControlApiAuthenticator(config);
  }

  return new StaticControlApiAuthenticator(
    config.auth.staticApiKey ?? "dev-local-control-api-key",
  );
}

export async function requireControlApiAuth(
  input: {
    readonly request: Request;
    readonly set: { status?: number | string };
    readonly config: ControlApiConfig;
    readonly authenticator: ControlApiAuthenticator;
    readonly requiredScope: ApiKeyScope;
  },
): Promise<
  | {
      readonly ok: true;
      readonly principal: ApiKeyPrincipal;
    }
  | {
      readonly ok: false;
      readonly response: ReturnType<typeof fail>;
    }
> {
  const apiKey = extractApiKeyFromRequest(
    input.request,
    input.config.auth.headerName,
  );

  const principal = await input.authenticator.authenticate(apiKey);

  if (!principal) {
    return {
      ok: false,
      response: fail(
        input.set,
        401,
        "unauthorized",
        "A valid Control API key is required.",
      ),
    };
  }

  if (!hasRequiredScope(principal, input.requiredScope)) {
    return {
      ok: false,
      response: fail(
        input.set,
        403,
        "forbidden",
        `API key is missing required scope: ${input.requiredScope}`,
      ),
    };
  }

  return {
    ok: true,
    principal,
  };
}
