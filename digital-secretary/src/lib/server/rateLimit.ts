type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  tokensPerInterval: number; // capacity
  refillIntervalMs: number; // interval to refill full capacity
};

const DEFAULTS: RateLimitConfig = {
  tokensPerInterval: 30,
  refillIntervalMs: 60_000,
};

export function rateLimit(key: string, cfg: Partial<RateLimitConfig> = {}): boolean {
  const { tokensPerInterval, refillIntervalMs } = { ...DEFAULTS, ...cfg };
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: tokensPerInterval, lastRefill: now };
  // Refill proportionally
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = (elapsed / refillIntervalMs) * tokensPerInterval;
    bucket.tokens = Math.min(tokensPerInterval, bucket.tokens + refill);
    bucket.lastRefill = now;
  }
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

export function keyFor(req: Request, bucketName: string): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${bucketName}:${ip}`;
}
