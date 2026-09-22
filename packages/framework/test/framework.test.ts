import { describe, expect, it } from "vitest";

import {
  ForbiddenError,
  StaticTokenStore,
  UnauthorizedError,
  getUser,
  hasPermission,
  registerRole,
  requirePermission,
  requireUser,
  withAuth,
} from "../src";
import { authedRequest, makeTestUser, tokenStoreFor } from "../src/testing";

const ADMIN = makeTestUser({ id: "u-admin", roles: ["admin"] });
const BUILDER = makeTestUser({ id: "u-builder", roles: ["builder"] });
const VIEWER = makeTestUser({ id: "u-viewer", roles: ["viewer"] });

const store = new StaticTokenStore({
  "tok-admin": ADMIN,
  "tok-builder": BUILDER,
  "tok-viewer": VIEWER,
});

describe("auth", () => {
  it("returns null without a bearer token", () => {
    expect(getUser(new Request("http://x"), store)).toBeNull();
  });

  it("returns null for an unknown token", () => {
    expect(
      getUser(authedRequest("http://x", "bogus"), store),
    ).toBeNull();
  });

  it("resolves a known token to its user", () => {
    expect(getUser(authedRequest("http://x", "tok-viewer"), store)).toBe(VIEWER);
  });

  it("requireUser throws 401 when unauthenticated", () => {
    expect(() => requireUser(new Request("http://x"), store)).toThrow(
      UnauthorizedError,
    );
  });
});

describe("permissions", () => {
  it("grants builder tools:read and tools:write", () => {
    expect(hasPermission(BUILDER, "tools:read")).toBe(true);
    expect(hasPermission(BUILDER, "tools:write")).toBe(true);
  });

  it("denies viewer tools:write", () => {
    expect(hasPermission(VIEWER, "tools:write")).toBe(false);
    expect(() => requirePermission(VIEWER, "tools:write")).toThrow(
      ForbiddenError,
    );
  });

  it("admin wildcard passes any permission", () => {
    expect(hasPermission(ADMIN, "anything:at-all")).toBe(true);
  });

  it("registerRole extends a role's permissions", () => {
    const user = makeTestUser({ roles: ["auditor"] });
    expect(hasPermission(user, "audit:read")).toBe(false);
    registerRole("auditor", ["audit:read"]);
    expect(hasPermission(user, "audit:read")).toBe(true);
  });
});

describe("withAuth", () => {
  const okHandler = () => Response.json({ ok: true });
  const handler = withAuth("tools:read", okHandler, store);

  it("returns 401 without a token", async () => {
    const res = await handler(new Request("http://x"), {});
    expect(res.status).toBe(401);
  });

  it("returns 403 for an authenticated user lacking the permission", async () => {
    const strict = withAuth("tools:write", okHandler, store);
    const res = await strict(authedRequest("http://x", "tok-viewer"), {});
    expect(res.status).toBe(403);
  });

  it("calls the handler with the user when authorized", async () => {
    const res = await handler(authedRequest("http://x", "tok-viewer"), {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rethrows unexpected errors instead of swallowing them", async () => {
    const boom = withAuth(
      "tools:read",
      () => {
        throw new Error("boom");
      },
      tokenStoreFor({ "tok-viewer": VIEWER }),
    );
    await expect(
      boom(authedRequest("http://x", "tok-viewer"), {}),
    ).rejects.toThrow("boom");
  });
});
