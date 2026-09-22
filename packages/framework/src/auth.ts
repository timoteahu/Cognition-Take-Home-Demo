import { UnauthorizedError } from "./errors";

export interface User {
  id: string;
  name: string;
  roles: readonly string[];
}

/** Maps a bearer token to a user. Production tools back this with the org directory/SSO. */
export interface TokenStore {
  resolve(token: string): User | null;
}

export class StaticTokenStore implements TokenStore {
  constructor(private readonly tokens: Record<string, User>) {}

  resolve(token: string): User | null {
    return this.tokens[token] ?? null;
  }
}

// Dev-only tokens. TOOL_DEV_TOKENS (JSON of token -> {id, name, roles}) overrides
// these when set. Never put real credentials in this file.
const DEV_DEFAULT_TOKENS: Record<string, User> = {
  "dev-admin-token": { id: "u-admin", name: "Dev Admin", roles: ["admin"] },
  "dev-builder-token": { id: "u-builder", name: "Dev Builder", roles: ["builder"] },
  "dev-viewer-token": { id: "u-viewer", name: "Dev Viewer", roles: ["viewer"] },
};

export function defaultTokenStore(): TokenStore {
  const fromEnv = process.env.TOOL_DEV_TOKENS;
  if (fromEnv) return new StaticTokenStore(JSON.parse(fromEnv));
  return new StaticTokenStore(DEV_DEFAULT_TOKENS);
}

export function getUser(
  request: Request,
  store: TokenStore = defaultTokenStore(),
): User | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return store.resolve(header.slice("Bearer ".length));
}

export function requireUser(
  request: Request,
  store: TokenStore = defaultTokenStore(),
): User {
  const user = getUser(request, store);
  if (!user) throw new UnauthorizedError();
  return user;
}
