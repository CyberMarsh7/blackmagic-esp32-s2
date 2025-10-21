import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, badRequest, notFound, tooManyRequests, unauthorized } from "@/lib/server/responses";
import { MessageReadSchema } from "@/lib/server/validation";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";
import { verifyAdminJwt } from "@/lib/server/auth";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 2] ?? ""; // .../messages/{id}/read
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);

  const rlKey = keyFor(req, "messages:read");
  if (!rateLimit(rlKey, { tokensPerInterval: 200 })) return tooManyRequests("Slow down", req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = { read: true };
  }
  const parse = MessageReadSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const updated = await prisma.message
    .update({
      where: { id },
      data: { readStatus: parse.data.read },
    })
    .catch(() => null);
  if (!updated) return notFound("Message not found", req);
  return json(updated, undefined, req);
}
