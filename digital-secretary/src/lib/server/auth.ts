import { getEnv } from "./env";
import { SignJWT, jwtVerify } from "jose";

export type AdminClaims = {
  sub: string; // username
  role: "admin";
};

export async function signAdminJwt(username: string): Promise<string> {
  const { jwtSecret } = getEnv();
  const key = new TextEncoder().encode(jwtSecret);
  const token = await new SignJWT({ role: "admin" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
  return token;
}

export async function verifyAdminJwt(authorizationHeader?: string): Promise<AdminClaims | null> {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if ((scheme ?? "").toLowerCase() !== "bearer" || !token) return null;
  try {
    const { jwtSecret } = getEnv();
    const key = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, key);
    const role = (payload as Record<string, unknown>)["role"];
    if (role !== "admin" || typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: "admin" };
  } catch {
    return null;
  }
}

export function requireDeviceApiKey(req: Request): boolean {
  const { deviceApiKey } = getEnv();
  if (!deviceApiKey) return false;
  const provided = req.headers.get("x-api-key");
  return !!provided && provided === deviceApiKey;
}
