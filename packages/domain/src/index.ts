export type EnvironmentKind = "local" | "dev" | "staging" | "production" | "preview";

export interface PlatformProjectRef {
  readonly id: string;
  readonly organizationId: string;
  readonly slug: string;
  readonly name: string;
}

export interface RuntimeEnvironmentRef {
  readonly id: string;
  readonly projectId: string;
  readonly kind: EnvironmentKind;
  readonly name: string;
}
