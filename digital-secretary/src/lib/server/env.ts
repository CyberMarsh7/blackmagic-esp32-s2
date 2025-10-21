export function getEnv() {
  const {
    DATABASE_URL,
    ADMIN_USERNAME,
    ADMIN_PASSWORD,
    DEVICE_API_KEY,
    JWT_SECRET,
    CORS_ALLOWED_ORIGINS,
    EMAIL_PROVIDER,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    FROM_EMAIL,
    AI_PROVIDER,
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    NODE_ENV,
  } = process.env;

  if (!JWT_SECRET) throw new Error("JWT_SECRET is required");

  return {
    databaseUrl: DATABASE_URL ?? "file:./dev.db",
    adminUsername: ADMIN_USERNAME ?? "admin",
    adminPassword: ADMIN_PASSWORD ?? "change-me",
    deviceApiKey: DEVICE_API_KEY ?? "",
    jwtSecret: JWT_SECRET,
    allowedOrigins: (CORS_ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    email: {
      provider: EMAIL_PROVIDER ?? "smtp",
      smtp: {
        host: SMTP_HOST ?? "localhost",
        port: Number(SMTP_PORT ?? "1025"),
        secure: (SMTP_SECURE ?? "false").toLowerCase() === "true",
        user: SMTP_USER ?? "",
        pass: SMTP_PASS ?? "",
      },
      from: FROM_EMAIL ?? "no-reply@example.com",
    },
    ai: {
      provider: AI_PROVIDER ?? "openai",
      openaiApiKey: OPENAI_API_KEY ?? "",
      anthropicApiKey: ANTHROPIC_API_KEY ?? "",
    },
    isProd: NODE_ENV === "production",
  } as const;
}
