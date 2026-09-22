import { requireUser, type TokenStore, type User } from "./auth";
import { requirePermission } from "./permissions";
import { HttpError } from "./errors";

export type RouteContext = { params?: Promise<Record<string, string>> };

export type AuthedHandler = (
  request: Request,
  user: User,
  context: RouteContext,
) => Response | Promise<Response>;

/**
 * Wraps a route handler with the framework's auth contract:
 * resolves the bearer token to a user and enforces `permission`
 * before the handler runs. Returns 401/403 JSON otherwise.
 */
export function withAuth(
  permission: string,
  handler: AuthedHandler,
  store?: TokenStore,
): (request: Request, context: RouteContext) => Promise<Response> {
  return async (request, context) => {
    try {
      const user = requireUser(request, store);
      requirePermission(user, permission);
      return await handler(request, user, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
  };
}
