import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, badRequest, tooManyRequests, unauthorized } from "@/lib/server/responses";
import { MessageCreateSchema } from "@/lib/server/validation";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";
import { verifyAdminJwt } from "@/lib/server/auth";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const auth = await verifyAdminJwt(req.headers.get("authorization") ?? undefined);
  if (!auth) return unauthorized("Admin token required", req);

  const rlKey = keyFor(req, "messages:get");
  if (!rateLimit(rlKey, { tokensPerInterval: 60 })) return tooManyRequests("Slow down", req);

  const { searchParams } = new URL(req.url);
  const read = searchParams.get("read");
  const filterRead = read === "true" ? true : read === "false" ? false : undefined;

  const messages = await prisma.message.findMany({
    where: { readStatus: filterRead },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return json({ items: messages }, undefined, req);
}

export async function POST(req: Request) {
  const rlKey = keyFor(req, "messages:post");
  if (!rateLimit(rlKey)) return tooManyRequests("Slow down", req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON", req);
  }
  const parse = MessageCreateSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const created = await prisma.message.create({
    data: {
      message: parse.data.message,
      visitorId: parse.data.visitorId ?? undefined,
    },
  });
  return json(created, { status: 201 }, req);
}
