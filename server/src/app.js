import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const VERCEL_PREVIEW_PATTERN = /^https:\/\/[\w-]+\.vercel\.app$/;

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (curl, health probes, server-to-server)
    // are not browser cross-origin requests, so CORS does not apply to them.
    if (!origin || env.clientUrls.includes(origin) || VERCEL_PREVIEW_PATTERN.test(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error(`Origin ${origin} is not allowed by CORS`);
    error.status = 403;
    callback(error);
  },
  credentials: true,
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
