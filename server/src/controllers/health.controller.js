/**
 * Liveness probe. Intentionally reports no environment or credential details.
 */
export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    service: "kirana-connect-api",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
