/**
 * A minimal in-memory TTL cache. There is no Redis or other shared cache
 * layer anywhere in this repository (confirmed by audit before adding this),
 * so this is deliberately the simplest thing that protects a public
 * third-party API from repeated identical requests -- process-local, lost on
 * restart, and not shared across multiple server instances. That is an
 * accepted limitation for this prototype, documented rather than hidden.
 */
export function createTtlCache({ ttlMs }) {
  const store = new Map();

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}
