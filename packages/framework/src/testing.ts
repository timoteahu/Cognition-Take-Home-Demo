import type { User } from "./auth";

/** Test helpers shared by all tools' test suites. */

export function makeTestUser(overrides: Partial<User> = {}): User {
  return {
    id: "u-test",
    name: "Test User",
    roles: ["viewer"],
    ...overrides,
  };
}

/** Build a fetch Request with a bearer token, as a tool's tests would issue it. */
export function authedRequest(
  url: string,
  token: string,
  init: RequestInit = {},
): Request {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return new Request(url, { ...init, headers });
}

export function tokenStoreFor(
  entries: Record<string, User>,
): { resolve(token: string): User | null } {
  return { resolve: (token) => entries[token] ?? null };
}
