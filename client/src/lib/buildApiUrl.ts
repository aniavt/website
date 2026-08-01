/**
 * Build API URL for fetch.
 * SSR: absolute PUBLIC_SERVER_URL (runtime process.env, then build-time import.meta.env).
 * Browser: relative /api via nginx proxy.
 * Callers pass resource paths without /api prefix (e.g. "/anime?activeOnly=true").
 */
export function buildApiUrl(path: string): string {
  if (typeof window === "undefined") {
    const g =
      typeof globalThis !== "undefined"
        ? (globalThis as { process?: { env?: Record<string, string> } })
        : null;
    const envUrl = g?.process?.env?.PUBLIC_SERVER_URL;
    const base = envUrl || import.meta.env.PUBLIC_SERVER_URL || "";
    return `${base.replace(/\/+$/, "")}${path}`;
  }
  return `/api${path}`;
}
