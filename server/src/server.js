import { createApp } from "./app.js";
import { env, isSupabaseConfigured } from "./config/env.js";

const app = createApp();

// No host is passed so the process binds every interface, which is what Render
// expects when it maps the service to process.env.PORT.
const server = app.listen(env.port, () => {
  console.log(`[kirana-connect-api] environment : ${env.nodeEnv}`);
  console.log(`[kirana-connect-api] listening   : port ${env.port}`);
  console.log(`[kirana-connect-api] cors origins: ${env.clientUrls.join(", ")}`);
  console.log(
    `[kirana-connect-api] supabase    : ${isSupabaseConfigured ? "configured" : "not configured"}`,
  );
});

const shutdown = (signal) => {
  console.log(`[kirana-connect-api] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
