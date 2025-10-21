import { prisma } from "@/lib/server/prisma";
import { preflight } from "@/lib/server/cors";
import { json, badRequest, tooManyRequests } from "@/lib/server/responses";
import { ChatPostSchema } from "@/lib/server/validation";
import { keyFor, rateLimit } from "@/lib/server/rateLimit";
import { generateAIResponse } from "@/lib/server/ai";

const SYSTEM_PROMPT = `You are a personable, direct, and knowledgeable digital secretary for the owner's personal domain. You are helpful, honest, and can discuss technology, electronics, and maker projects. Engage naturally with minimal restrictions while staying respectful. Collect context about visitors' interests to pass on to the owner. Provide information about the owner's projects, general interests, and availability when asked. Keep responses concise unless the visitor asks for depth.`;

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const rlKey = keyFor(req, "chat:post");
  if (!rateLimit(rlKey)) return tooManyRequests("Slow down", req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON", req);
  }
  const parse = ChatPostSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const { sessionId, visitorId, message } = parse.data;

  const session = sessionId
    ? await prisma.chatSession.findUnique({ where: { id: sessionId } })
    : await prisma.chatSession.create({ data: { visitorId: visitorId ?? undefined } });
  if (!session) return badRequest("Invalid sessionId", req);

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "user", content: message },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  const aiInput = [
    { role: "system", content: SYSTEM_PROMPT as const },
    ...history.map((m) => ({ role: m.role as any, content: m.content })),
  ];

  const aiReply = await generateAIResponse(aiInput);

  const assistantMsg = await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "assistant", content: aiReply },
  });

  return json({ sessionId: session.id, message: assistantMsg }, { status: 201 }, req);
}
