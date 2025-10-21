import { createSseStream, sseHeaders } from "@/lib/server/sse";
import { corsHeaders, preflight } from "@/lib/server/cors";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const { stream } = createSseStream();
  const headers = { ...sseHeaders(), ...corsHeaders(req.headers.get("origin")) };
  return new Response(stream as unknown as ReadableStream, { headers });
}
