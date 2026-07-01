export type AppEnvironment = "local" | "development" | "staging" | "production" | "preview";

export interface RuntimeDefaults {
  readonly projectId: string;
  readonly apiPort: number;
  readonly dbPort: number;
  readonly studioPort: number;
  readonly inbucketPort: number;
}

export const runtimeDefaults: RuntimeDefaults = {
  projectId: "open-backend-cloud-runtime",
  apiPort: 54321,
  dbPort: 54322,
  studioPort: 54323,
  inbucketPort: 54324,
};

export function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
