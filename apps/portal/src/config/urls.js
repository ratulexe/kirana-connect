/**
 * The Consumer Platform is a separately deployed app, not an internal route.
 * One source of truth here -- both the gateway's Consumer card and the
 * Entrepreneur footer's "Visit Consumer Platform" link import this constant
 * rather than each hard-coding their own copy of the URL.
 *
 * VITE_CONSUMER_APP_URL overrides both environments if set. Otherwise this
 * falls back to the right URL for whichever environment is actually
 * running, so it works correctly out of the box in dev and in production.
 */
export const CONSUMER_APP_URL =
  import.meta.env.VITE_CONSUMER_APP_URL ??
  (import.meta.env.DEV ? "http://localhost:5173/" : "https://kirana-connect-one.vercel.app/");
