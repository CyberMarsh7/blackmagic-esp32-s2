import nodemailer from "nodemailer";
import { getEnv } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const env = getEnv();
  if (env.email.provider !== "smtp") return; // extend for other providers if needed

  const transporter = nodemailer.createTransport({
    host: env.email.smtp.host,
    port: env.email.smtp.port,
    secure: env.email.smtp.secure,
    auth:
      env.email.smtp.user && env.email.smtp.pass
        ? { user: env.email.smtp.user, pass: env.email.smtp.pass }
        : undefined,
  });

  await transporter.sendMail({
    from: env.email.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}
