import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "./env";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export async function generateAIResponse(messages: AIMessage[]): Promise<string> {
  const env = getEnv();
  if (env.ai.provider === "anthropic") {
    if (!env.ai.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is required");
    const client = new Anthropic({ apiKey: env.ai.anthropicApiKey });
    const resp = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 512,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
      system: messages.find((m) => m.role === "system")?.content,
    });
    const textBlock = resp.content.find((c) => (c as { type?: string }).type === "text");
    return (textBlock as { type: string; text?: string } | undefined)?.text ?? "";
  }

  if (!env.ai.openaiApiKey) throw new Error("OPENAI_API_KEY is required");
  const openai = new OpenAI({ apiKey: env.ai.openaiApiKey });
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 512,
    temperature: 0.7,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  return resp.choices[0]?.message?.content ?? "";
}
