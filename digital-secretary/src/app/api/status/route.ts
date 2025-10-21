import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, badRequest, tooManyRequests, unauthorized } from "@/lib/server/responses";
import { StatusUpdateSchema } from "@/lib/server/validation";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";
import { requireDeviceApiKey } from "@/lib/server/auth";
import { broadcastSse } from "@/lib/server/sse";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const rlKey = keyFor(req, "status:get");
  if (!rateLimit(rlKey)) return tooManyRequests("Slow down", req);

  const status = await prisma.status.findUnique({ where: { id: 1 } });
  const payload =
    status ?? (await prisma.status.create({ data: { id: 1, isAvailable: false } }));
  return json(payload, undefined, req);
}

export async function POST(req: Request) {
  if (!requireDeviceApiKey(req)) return unauthorized("Missing or invalid API key", req);

  const rlKey = keyFor(req, "status:post");
  if (!rateLimit(rlKey, { tokensPerInterval: 10 })) return tooManyRequests("Slow down", req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON", req);
  }
  const parse = StatusUpdateSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const { isAvailable, manualOverride, overrideUntil } = parse.data;
  const updated = await prisma.status.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      isAvailable,
      manualOverride: manualOverride ?? false,
      updatedBy: "device",
      overrideUntil: overrideUntil ? new Date(overrideUntil) : null,
    },
    update: {
      isAvailable,
      manualOverride: manualOverride ?? undefined,
      overrideUntil: overrideUntil ? new Date(overrideUntil) : null,
      updatedBy: "device",
    },
  });

  broadcastSse("status", { isAvailable: updated.isAvailable, at: updated.lastUpdated });
  return json(updated, undefined, req);
}
