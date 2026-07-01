export interface ControlApiClientOptions {
  readonly baseUrl: string;
  readonly fetchImpl?: typeof fetch;
}

export interface ControlApiHealth {
  readonly status: "ok";
  readonly service: "control-api";
  readonly timestamp: string;
}

export interface ControlApiVersion {
  readonly service: "control-api";
  readonly version: string;
  readonly environment: string;
}

export class ControlApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ControlApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async health(): Promise<ControlApiHealth> {
    return this.get<ControlApiHealth>("/health");
  }

  async version(): Promise<ControlApiVersion> {
    return this.get<ControlApiVersion>("/version");
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Control API request failed: GET ${path} returned ${response.status}`,
      );
    }

    return response.json() as Promise<T>;
  }
}
