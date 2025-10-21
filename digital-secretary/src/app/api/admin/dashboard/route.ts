import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, unauthorized } from "@/lib/server/responses";
import { verifyAdminJwt } from "@/lib/server/auth";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);

  const [visitors, messages, unreadMessages] = await Promise.all([
    prisma.visitor.count(),
    prisma.message.count(),
    prisma.message.count({ where: { readStatus: false } }),
  ]);

  return json({ visitors, messages, unreadMessages }, undefined, req);
}
