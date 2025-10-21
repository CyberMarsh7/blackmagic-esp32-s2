import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, badRequest, unauthorized } from "@/lib/server/responses";
import { AdminSettingsSchema } from "@/lib/server/validation";
import { verifyAdminJwt } from "@/lib/server/auth";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return json(settings, undefined, req);
}

export async function PUT(req: Request) {
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON", req);
  }
  const parse = AdminSettingsSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const updated = await prisma.settings.update({
    where: { id: 1 },
    data: {
      notificationPreferences: parse.data.notificationPreferences ?? undefined,
      aiConfiguration: parse.data.aiConfiguration ?? undefined,
    },
  });
  return json(updated, undefined, req);
}
