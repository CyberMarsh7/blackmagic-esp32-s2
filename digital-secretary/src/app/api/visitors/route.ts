import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, badRequest, tooManyRequests, unauthorized } from "@/lib/server/responses";
import { VisitorCreateSchema } from "@/lib/server/validation";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";
import { verifyAdminJwt } from "@/lib/server/auth";
import { getEnv } from "@/lib/server/env";
import { sendEmail } from "@/lib/server/email";

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);

  const rlKey = keyFor(req, "visitors:get");
  if (!rateLimit(rlKey, { tokensPerInterval: 60 })) return tooManyRequests("Slow down", req);

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const cursor = searchParams.get("cursor") ?? undefined;

  const visitors = await prisma.visitor.findMany({
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
  });

  const nextCursor = visitors.length > take ? visitors[take].id : null;
  const items = visitors.slice(0, take);
  return json({ items, nextCursor }, undefined, req);
}

export async function POST(req: Request) {
  const rlKey = keyFor(req, "visitors:post");
  if (!rateLimit(rlKey)) return tooManyRequests("Slow down", req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parse = VisitorCreateSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const visitor = await prisma.visitor.create({
    data: {
      ip: ip || undefined,
      userAgent,
      locationData: parse.data.locationData ?? undefined,
      contactEmail: parse.data.contactEmail ?? undefined,
      contactName: parse.data.contactName ?? undefined,
    },
  });
  // Notify via email if configured
  try {
    const env = getEnv();
    const notifyTo = env.email.from; // You can change to owner email if provided
    await sendEmail({
      to: notifyTo,
      subject: `New Visitor${visitor.contactName ? `: ${visitor.contactName}` : ""}`,
      text: `New visitor at ${visitor.createdAt.toISOString()}\nIP: ${visitor.ip ?? "unknown"}\nUA: ${visitor.userAgent ?? ""}`,
    });
  } catch {
    // ignore email errors in public endpoint
  }
  return json(visitor, { status: 201 }, req);
}
