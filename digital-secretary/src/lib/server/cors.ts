import { getEnv } from "./env";

export function corsHeaders(origin: string | null): HeadersInit {
  const { allowedOrigins } = getEnv();
  const isAllowed = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin! : allowedOrigins[0] ?? "*",
    Vary: "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS",
  } satisfies HeadersInit;
}

export function withCors(resp: Response, origin: string | null): Response {
  const headers = new Headers(resp.headers);
  for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, String(v));
  return new Response(resp.body, { status: resp.status, headers });
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const headers = corsHeaders(req.headers.get("origin"));
  return new Response(null, { status: 204, headers });
}
