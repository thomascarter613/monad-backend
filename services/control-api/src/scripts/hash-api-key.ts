import { hashApiKey } from "@monad-backend/auth";

const apiKey = Bun.argv[2];

if (!apiKey) {
  console.error("Usage:");
  console.error("  bun run auth:hash <api-key>");
  process.exit(1);
}

const result = hashApiKey(apiKey);

console.log(JSON.stringify(result, null, 2));
