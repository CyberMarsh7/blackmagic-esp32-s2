"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const evtRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setIsAvailable(Boolean(s.isAvailable)))
      .catch(() => {});
    const es = new EventSource("/api/status/stream");
    es.onmessage = () => {};
    es.addEventListener("status", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        setIsAvailable(Boolean(data.isAvailable));
      } catch {}
    });
    evtRef.current = es;
    return () => {
      es.close();
    };
  }, []);

  async function sendMessage() {
    const content = input.trim();
    if (!content) return;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId ?? undefined, message: content }),
    });
    const data = await resp.json();
    if (data.sessionId && !sessionId) setSessionId(data.sessionId);
    if (data.message?.content) setMessages((m) => [...m, { role: "assistant", content: data.message.content }]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Digital Secretary</h1>
          <div className="flex items-center gap-2">
            <div className={`relative w-10 h-6 rounded-full ${isAvailable ? "bg-green-500" : "bg-gray-400"}`}>
              <div
                className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isAvailable ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-sm">{isAvailable === null ? "..." : isAvailable ? "Available" : "Away"}</span>
          </div>
        </header>

        <main className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="rounded-xl border bg-white shadow p-6">
            <h2 className="font-semibold mb-2">Welcome</h2>
            <p className="text-sm text-slate-600">Come on in. The secretary will take your message.</p>
            <div className="mt-6 relative h-40 bg-slate-200 rounded-lg overflow-hidden">
              <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-36 bg-amber-700 rounded-t-sm transition-transform duration-700 origin-left ${
                  isAvailable ? "-rotate-40" : "rotate-0"
                }`}
                aria-label="Door"
              />
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-500" />
            </div>
          </section>

          <section className="rounded-xl border bg-white shadow p-6 flex flex-col h-[420px]">
            <h2 className="font-semibold mb-2">Chat</h2>
            <div className="flex-1 overflow-auto space-y-3 pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
                  <span
                    className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
                      m.role === "user" ? "bg-sky-600 text-white" : "bg-slate-100"
                    }`}
                  >
                    {m.content}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Say hello..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button
                className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm disabled:opacity-50"
                onClick={sendMessage}
                disabled={!input.trim()}
              >
                Send
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
