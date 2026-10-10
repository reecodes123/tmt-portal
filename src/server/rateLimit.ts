/**
 * Minimal in-memory, per-process rate limiter for anonymous endpoints. SERVER ONLY.
 *
 * The routes this guards originally carried a TODO recommending Vercel KV +
 * @upstash/ratelimit — a distributed store, appropriate once this runs
 * across multiple serverless instances/regions. That needs infrastructure
 * (a provisioned KV store) this change can't add on its own. This is the
 * honest, zero-infra alternative: a fixed-window counter per (IP, bucket)
 * key, held in this process's memory. It resets on restart and doesn't
 * share state across instances — but at this app's actual scale (a single
 * small-org deployment), it still meaningfully blocks scripted abuse from a
 * single client today. Swap for the distributed version before running
 * multiple instances in production.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Sweep stale entries periodically so `buckets` doesn't grow unbounded over
// a long-running process — this is not itself the rate-limit check.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleBuckets(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(request: Request): string {
  // Trusts X-Forwarded-For, which is fine here: this limiter is a spam
  // speed-bump, not a security boundary, so a spoofed header just means an
  // attacker rate-limits themselves under a fake key rather than a real one.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** True if this request is within its (ip, bucket) quota; false if it should be rejected. */
export function checkRateLimit(
  request: Request,
  bucketName: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  cleanupStaleBuckets(now);

  const key = `${bucketName}:${getClientIp(request)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}
