import { withCors } from "./cors";

export function json(data: unknown, init?: ResponseInit, req?: Request): Response {
  const body = JSON.stringify(data, null, 2);
  const resp = new Response(body, {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return withCors(resp, req?.headers.get("origin") ?? null);
}

export function badRequest(message: string, req?: Request): Response {
  return json({ error: message }, { status: 400 }, req);
}

export function unauthorized(message = "Unauthorized", req?: Request): Response {
  return json({ error: message }, { status: 401 }, req);
}

export function forbidden(message = "Forbidden", req?: Request): Response {
  return json({ error: message }, { status: 403 }, req);
}

export function tooManyRequests(message = "Too Many Requests", req?: Request): Response {
  return json({ error: message }, { status: 429 }, req);
}

export function notFound(message = "Not Found", req?: Request): Response {
  return json({ error: message }, { status: 404 }, req);
}

export function serverError(message = "Internal Server Error", req?: Request): Response {
  return json({ error: message }, { status: 500 }, req);
}
