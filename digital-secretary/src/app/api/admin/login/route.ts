import { preflight } from "@/lib/server/cors";
import { json, badRequest, unauthorized } from "@/lib/server/responses";
import { AdminLoginSchema } from "@/lib/server/validation";
import { getEnv } from "@/lib/server/env";
import { signAdminJwt } from "@/lib/server/auth";

export async function OPTIONS(req: Request) {
  return preflight(req) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON", req);
  }
  const parse = AdminLoginSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.message, req);

  const env = getEnv();
  if (parse.data.username !== env.adminUsername || parse.data.password !== env.adminPassword) {
    return unauthorized("Invalid credentials", req);
  }
  const token = await signAdminJwt(env.adminUsername);
  return json({ token }, { status: 201 }, req);
}
