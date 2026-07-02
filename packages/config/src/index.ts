import type { ControlApiAuthMode } from "@monad-backend/auth";

export type RuntimeEnvironment =
  | "local"
  | "test"
  | "development"
  | "staging"
  | "production";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export type ControlApiStoreMode = "memory" | "database";

export interface ControlPlaneDatabaseConfig {
  readonly url: string | undefined;
  readonly schema: string;
  readonly maxConnections: number;
}

export interface ControlApiAuthConfig {
  readonly mode: ControlApiAuthMode;
  readonly headerName: string;
  readonly staticApiKey: string | undefined;
}

export interface ControlApiConfig {
  readonly serviceName: "control-api";
  readonly version: string;
  readonly environment: RuntimeEnvironment;
  readonly hostname: string;
  readonly port: number;
  readonly publicBaseUrl: string;
  readonly logLevel: LogLevel;
  readonly storeMode: ControlApiStoreMode;
  readonly database: ControlPlaneDatabaseConfig;
  readonly auth: ControlApiAuthConfig;
}

function readString(
  env: Record<string, string | undefined>,
  key: string,
  fallback: string,
): string {
  const value = env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function readOptionalString(
  env: Record<string, string | undefined>,
  key: string,
): string | undefined {
  const value = env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(
  env: Record<string, string | undefined>,
  key: string,
  fallback: number,
): number {
  const value = env[key];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a finite number.`);
  }

  return parsed;
}

function readRuntimeEnvironment(
  env: Record<string, string | undefined>,
): RuntimeEnvironment {
  const value = readString(env, "CONTROL_API_ENV", "local");

  if (
    value === "local" ||
    value === "test" ||
    value === "development" ||
    value === "staging" ||
    value === "production"
  ) {
    return value;
  }

  throw new Error(
    `CONTROL_API_ENV must be one of local, test, development, staging, production. Received: ${value}`,
  );
}

function readLogLevel(env: Record<string, string | undefined>): LogLevel {
  const value = readString(env, "CONTROL_API_LOG_LEVEL", "info");

  if (
    value === "trace" ||
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error"
  ) {
    return value;
  }

  throw new Error(
    `CONTROL_API_LOG_LEVEL must be one of trace, debug, info, warn, error. Received: ${value}`,
  );
}

function readStoreMode(
  env: Record<string, string | undefined>,
): ControlApiStoreMode {
  const value = readString(env, "CONTROL_API_STORE_MODE", "memory");

  if (value === "memory" || value === "database") {
    return value;
  }

  throw new Error(
    `CONTROL_API_STORE_MODE must be either memory or database. Received: ${value}`,
  );
}

function readAuthMode(
  env: Record<string, string | undefined>,
): ControlApiAuthMode {
  const value = readString(env, "CONTROL_API_AUTH_MODE", "static");

  if (value === "disabled" || value === "static" || value === "database") {
    return value;
  }

  throw new Error(
    `CONTROL_API_AUTH_MODE must be disabled, static, or database. Received: ${value}`,
  );
}

export function loadControlApiConfig(
  env: Record<string, string | undefined> = Bun.env,
): ControlApiConfig {
  const hostname = readString(env, "CONTROL_API_HOST", "127.0.0.1");
  const port = readNumber(env, "CONTROL_API_PORT", 4310);

  return {
    serviceName: "control-api",
    version: readString(env, "CONTROL_API_VERSION", "0.1.0"),
    environment: readRuntimeEnvironment(env),
    hostname,
    port,
    publicBaseUrl: readString(
      env,
      "CONTROL_API_PUBLIC_BASE_URL",
      `http://${hostname}:${port}`,
    ),
    logLevel: readLogLevel(env),
    storeMode: readStoreMode(env),
    database: {
      url:
        readOptionalString(env, "CONTROL_PLANE_DATABASE_URL") ??
        readOptionalString(env, "DATABASE_URL"),
      schema: readString(env, "CONTROL_PLANE_DATABASE_SCHEMA", "platform"),
      maxConnections: readNumber(env, "CONTROL_PLANE_DATABASE_MAX", 5),
    },
    auth: {
      mode: readAuthMode(env),
      headerName: readString(env, "CONTROL_API_KEY_HEADER", "x-control-api-key"),
      staticApiKey: readOptionalString(env, "CONTROL_API_DEV_API_KEY"),
    },
  };
}
