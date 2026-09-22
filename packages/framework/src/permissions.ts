import { ForbiddenError } from "./errors";
import type { User } from "./auth";

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  admin: ["*"],
  builder: ["tools:read", "tools:write"],
  viewer: ["tools:read"],
};

/** Register or extend the permissions granted to a role (e.g. by a tool that adds its own). */
export function registerRole(role: string, permissions: readonly string[]): void {
  ROLE_PERMISSIONS[role] = [...(ROLE_PERMISSIONS[role] ?? []), ...permissions];
}

export function permissionsFor(user: User): ReadonlySet<string> {
  const granted = new Set<string>();
  for (const role of user.roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) granted.add(perm);
  }
  return granted;
}

export function hasPermission(user: User, permission: string): boolean {
  const granted = permissionsFor(user);
  return granted.has("*") || granted.has(permission);
}

export function requirePermission(user: User, permission: string): void {
  if (!hasPermission(user, permission)) throw new ForbiddenError(permission);
}
