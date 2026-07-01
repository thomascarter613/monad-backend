export interface ControlPlaneClientOptions {
  readonly baseUrl: string;
  readonly token?: string;
}

export class ControlPlaneClient {
  readonly baseUrl: string;
  readonly token?: string;

  constructor(options: ControlPlaneClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
  }

  async health(): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
