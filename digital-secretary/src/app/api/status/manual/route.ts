import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, badRequest, tooManyRequests, unauthorized } from "@/lib/server/responses";
import { StatusManualSchema } from "@/lib/server/validation";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";
import { verifyAdminJwt } from "@/lib/server/auth";
import { broadcastSse } from "@/lib/server/sse";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function PUT(req: Request) {
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);

  const rlKey = keyFor(req, "status:manual");
  if (!rateLimit(rlKey, { tokensPerInterval: 20 })) return tooManyRequests("Slow down", req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON", req);
  }
  const parse = StatusManualSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const { manualOverride, isAvailable, overrideUntil } = parse.data;
  const updated = await prisma.status.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      isAvailable: isAvailable ?? false,
      manualOverride,
      overrideUntil: overrideUntil ? new Date(overrideUntil) : null,
      updatedBy: auth.sub,
    },
    update: {
      isAvailable: isAvailable ?? undefined,
      manualOverride,
      overrideUntil: overrideUntil ? new Date(overrideUntil) : null,
      updatedBy: auth.sub,
    },
  });
  broadcastSse("status", { isAvailable: updated.isAvailable, at: updated.lastUpdated });
  return json(updated, undefined, req);
}
