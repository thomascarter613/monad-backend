import { loadControlApiConfig } from "@open-backend-cloud/config";
import { createControlApiApp } from "./app";
import { createConfiguredControlPlaneStore } from "./state/configured-control-plane-store";

const config = loadControlApiConfig();
const store = createConfiguredControlPlaneStore(config);
const app = createControlApiApp({ config, store });

app.listen({
  hostname: config.hostname,
  port: config.port,
});

console.log(
  `[${config.serviceName}] listening on ${config.publicBaseUrl} in ${config.environment} mode using ${config.storeMode} store`,
);
