export const DEFAULT_CONTROL_API_BASE_PATH = "/api/control" as const;

export const CONTROL_API_ROUTES = {
  organizations: "/organizations",
  projects: "/projects",
  environments: "/environments",
  deployments: "/deployments",
  backups: "/backups",
  restores: "/restore-jobs",
  secrets: "/secrets",
  auditEvents: "/audit-events",
  usageEvents: "/usage-events",
  quotas: "/quotas",
  apiKeys: "/api-keys",
  webhooks: "/webhooks",
} as const;

export type ControlApiRouteName = keyof typeof CONTROL_API_ROUTES;
