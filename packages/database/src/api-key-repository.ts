import type { ApiKeyPrincipal, ApiKeyScope } from "@monad-backend/auth";
import postgres from "postgres";

export type ApiKeySql = ReturnType<typeof postgres>;

export interface ApiKeyDatabaseOptions {
  readonly url: string;
  readonly schema?: string;
  readonly maxConnections?: number;
}

export interface ApiKeyLookupResult {
  readonly principal: ApiKeyPrincipal;
}

interface ApiKeyRow {
  readonly id: string;
  readonly organization_id: string | null;
  readonly name: string;
  readonly scopes: string[] | null;
}

interface ColumnRow {
  readonly table_name: string;
  readonly column_name: string;
}

export interface ApiKeySchemaValidationResult {
  readonly ok: boolean;
  readonly missing: readonly string[];
}

const requiredApiKeyColumns = [
  "id",
  "organization_id",
  "name",
  "key_prefix",
  "key_hash",
  "scopes",
  "status",
  "expires_at",
  "last_used_at",
  "created_at",
  "updated_at",
] as const;

function assertSafeIdentifier(value: string, label: string): void {
  if (!/^[a-z_][a-z0-9_]*$/u.test(value)) {
    throw new Error(`${label} must be a safe SQL identifier. Received: ${value}`);
  }
}

export function createApiKeySql(options: ApiKeyDatabaseOptions): ApiKeySql {
  return postgres(options.url, {
    max: options.maxConnections ?? 5,
    prepare: false,
  });
}

export async function validateApiKeySchema(
  sql: ApiKeySql,
  schema = "platform",
): Promise<ApiKeySchemaValidationResult> {
  assertSafeIdentifier(schema, "schema");

  const rows = (await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = ${schema}
      and table_name = 'api_keys'
  `) as unknown as ColumnRow[];

  const actual = new Set(
    rows.map((row) => `${row.table_name}.${row.column_name}`),
  );

  const missing: string[] = [];

  for (const column of requiredApiKeyColumns) {
    const key = `api_keys.${column}`;

    if (!actual.has(key)) {
      missing.push(key);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}

export class PostgresApiKeyRepository {
  private readonly sql: ApiKeySql;
  private readonly schema: string;

  constructor(options: ApiKeyDatabaseOptions) {
    this.schema = options.schema ?? "platform";
    assertSafeIdentifier(this.schema, "schema");
    this.sql = createApiKeySql(options);
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }

  async findActivePrincipalByHash(
    keyHash: string,
  ): Promise<ApiKeyLookupResult | undefined> {
    const rows = (await this.sql.unsafe(
      `
        select
          id::text,
          organization_id::text,
          name,
          scopes
        from ${this.table("api_keys")}
        where key_hash = $1
          and status = 'active'
          and (expires_at is null or expires_at > now())
        limit 1
      `,
      [keyHash],
    )) as unknown as ApiKeyRow[];

    const row = rows[0];

    if (!row) {
      return undefined;
    }

    await this.sql.unsafe(
      `
        update ${this.table("api_keys")}
        set last_used_at = now(), updated_at = now()
        where id = $1
      `,
      [row.id],
    );

    return {
      principal: {
        actorType: "api_key",
        actorId: row.id,
        organizationId: row.organization_id,
        apiKeyId: row.id,
        name: row.name,
        scopes:
          row.scopes && row.scopes.length > 0
            ? (row.scopes as ApiKeyScope[])
            : ["management:*"],
      },
    };
  }

  private table(tableName: "api_keys"): string {
    assertSafeIdentifier(tableName, "tableName");
    return `"${this.schema}"."${tableName}"`;
  }
}

export function createPostgresApiKeyRepository(
  options: ApiKeyDatabaseOptions,
): PostgresApiKeyRepository {
  return new PostgresApiKeyRepository(options);
}
