import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, notFound, tooManyRequests } from "@/lib/server/responses";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request, context: any) {
  const { params } = context as { params: { session_id: string } };
  const rlKey = keyFor(req, "chat:history");
  if (!rateLimit(rlKey, { tokensPerInterval: 60 })) return tooManyRequests("Slow down", req);

  const session = await prisma.chatSession.findUnique({ where: { id: params.session_id } });
  if (!session) return notFound("Session not found", req);
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return json({ sessionId: session.id, items: messages }, undefined, req);
}
