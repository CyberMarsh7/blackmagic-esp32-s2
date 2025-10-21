import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, notFound, tooManyRequests, unauthorized } from "@/lib/server/responses";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";
import { verifyAdminJwt } from "@/lib/server/auth";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 1] ?? "";
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);

  const rlKey = keyFor(req, "visitors:get:id");
  if (!rateLimit(rlKey, { tokensPerInterval: 60 })) return tooManyRequests("Slow down", req);

  const visitor = await prisma.visitor.findUnique({
    where: { id },
    include: { messages: true, chatSessions: true },
  });
  if (!visitor) return notFound("Visitor not found", req);
  return json(visitor, undefined, req);
}
