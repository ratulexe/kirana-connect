/**
 * Error carrying an HTTP status, which errorHandler turns into a JSON response.
 */
export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export const badRequest = (message) => httpError(400, message);
export const notFoundError = (message) => httpError(404, message);

/**
 * Wraps an async route handler so a rejected promise reaches the error
 * middleware instead of hanging the request.
 */
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
