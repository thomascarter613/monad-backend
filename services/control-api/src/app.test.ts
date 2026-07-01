import { loadControlApiConfig } from "@open-backend-cloud/config";
import { describe, expect, it } from "bun:test";
import { createControlApiApp } from "./app";

function createTestApp() {
  return createControlApiApp({
    config: loadControlApiConfig({
      CONTROL_API_ENV: "test",
      CONTROL_API_HOST: "127.0.0.1",
      CONTROL_API_PORT: "0",
      CONTROL_API_PUBLIC_BASE_URL: "http://127.0.0.1:0",
      CONTROL_API_LOG_LEVEL: "error",
      CONTROL_API_VERSION: "test",
    }),
  });
}

async function json(response: Response): Promise<unknown> {
  return response.json();
}

describe("control-api", () => {
  it("returns health, readiness, and version responses", async () => {
    const app = createTestApp();

    const health = await app.handle(new Request("http://localhost/health"));
    expect(health.status).toBe(200);
    expect(await json(health)).toMatchObject({
      status: "ok",
      service: "control-api",
    });

    const ready = await app.handle(new Request("http://localhost/ready"));
    expect(ready.status).toBe(200);
    expect(await json(ready)).toMatchObject({
      status: "ready",
      service: "control-api",
    });

    const version = await app.handle(new Request("http://localhost/version"));
    expect(version.status).toBe(200);
    expect(await json(version)).toMatchObject({
      service: "control-api",
      version: "test",
      environment: "test",
    });
  });

  it("creates organizations, projects, environments, and audit events", async () => {
    const app = createTestApp();

    const organizationResponse = await app.handle(
      new Request("http://localhost/organizations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Example Organization",
          slug: "example",
        }),
      }),
    );

    expect(organizationResponse.status).toBe(201);

    const organizationBody = (await organizationResponse.json()) as {
      data: { id: string };
    };

    const projectResponse = await app.handle(
      new Request("http://localhost/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organizationBody.data.id,
          name: "Example Project",
          slug: "example-project",
        }),
      }),
    );

    expect(projectResponse.status).toBe(201);

    const projectBody = (await projectResponse.json()) as {
      data: { id: string };
    };

    const environmentResponse = await app.handle(
      new Request(
        `http://localhost/projects/${projectBody.data.id}/environments`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name: "Development",
            key: "development",
          }),
        },
      ),
    );

    expect(environmentResponse.status).toBe(201);

    const auditResponse = await app.handle(
      new Request("http://localhost/audit-events"),
    );

    expect(auditResponse.status).toBe(200);

    const auditBody = (await auditResponse.json()) as {
      data: Array<{ eventName: string }>;
      count: number;
    };

    expect(auditBody.count).toBe(3);
    expect(auditBody.data.map((event) => event.eventName)).toContain(
      "organization.created",
    );
    expect(auditBody.data.map((event) => event.eventName)).toContain(
      "project.created",
    );
    expect(auditBody.data.map((event) => event.eventName)).toContain(
      "project_environment.created",
    );
  });

  it("returns 404 when creating a project for a missing organization", async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request("http://localhost/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          organizationId: "org_missing",
          name: "Invalid Project",
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(await json(response)).toMatchObject({
      error: {
        code: "organization_not_found",
      },
    });
  });
});
