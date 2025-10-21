type Listener = {
  id: string;
  controller: ReadableStreamDefaultController<string>;
};

const listeners = new Map<string, Listener>();

export function createSseStream(): { stream: ReadableStream<string>; id: string } {
  const id = crypto.randomUUID();
  const stream = new ReadableStream<string>({
    start(controller) {
      listeners.set(id, { id, controller });
    },
    cancel() {
      listeners.delete(id);
    },
  });
  return { stream, id };
}

export function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

export function broadcastSse(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const { controller } of listeners.values()) {
    controller.enqueue(payload);
  }
}
