import { loadControlApiConfig } from "@monad-backend/config";
import { createControlApiApp } from "./app";
import { createConfiguredControlApiAuthenticator } from "./auth/control-api-authenticator";
import { createConfiguredControlPlaneStore } from "./state/configured-control-plane-store";

const config = loadControlApiConfig();
const store = createConfiguredControlPlaneStore(config);
const authenticator = createConfiguredControlApiAuthenticator(config);
const app = createControlApiApp({ config, store, authenticator });

app.listen({
  hostname: config.hostname,
  port: config.port,
});

console.log(
  `[${config.serviceName}] listening on ${config.publicBaseUrl} in ${config.environment} mode using ${config.storeMode} store and ${config.auth.mode} auth`,
);
