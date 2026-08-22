import { isProduction } from "../config/env.js";

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
export function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500;
  const message =
    status >= 500 && isProduction
      ? "Internal server error"
      : (err.message ?? "Internal server error");

  if (status >= 500) {
    console.error("[kirana-connect-api] unhandled error:", err);
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(isProduction ? {} : { stack: err.stack }),
    },
    // Some rejections are still useful to the caller. A duplicate store
    // submission, for example, returns the application the owner already has
    // so the UI can show its status instead of a dead end.
    ...(err.payload ? { data: err.payload } : {}),
  });
}
