import { loadControlApiConfig } from "@open-backend-cloud/config";
import { createControlApiApp } from "./app";

const config = loadControlApiConfig();
const app = createControlApiApp({ config });

app.listen({
  hostname: config.hostname,
  port: config.port,
});

console.log(
  `[${config.serviceName}] listening on ${config.publicBaseUrl} in ${config.environment} mode`,
);
