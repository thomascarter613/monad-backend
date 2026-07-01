export interface RuntimeMetadataRecord {
  readonly id: string;
  readonly key: string;
  readonly value: Record<string, unknown>;
  readonly created_at: string;
  readonly updated_at: string;
}

export type { Database, Json } from "./generated/supabase";
