export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Missing or invalid bearer token") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(permission: string) {
    super(403, `Missing permission: ${permission}`);
  }
}
