/**
 * Standard health endpoint every tool exposes at the same path. Wire it as
 * `export const GET = createHealthHandler("<tool-name>")` in
 * `app/api/health/route.ts`.
 */
export function createHealthHandler(appName: string): () => Response {
  return () =>
    Response.json({ status: "ok", app: appName, time: new Date().toISOString() });
}
