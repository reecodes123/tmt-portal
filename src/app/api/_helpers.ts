import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { AuthError } from "@/server/auth";

/**
 * A business-rule failure the caller should see verbatim — e.g. "can't
 * delete, N records still reference this". Distinct from the generic
 * catch-all below, which deliberately hides plain `Error` messages so
 * unexpected internals never leak to the client; this is for the opposite
 * case, a message that was written specifically to be shown.
 */
export class ConflictError extends Error {
  readonly status = 409;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Thrown by anonymous endpoints guarded by server/rateLimit.ts. */
export class RateLimitError extends Error {
  readonly status = 429;
  constructor(message = "Too many requests. Please slow down.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Common response helpers used by every route.
 *
 * The prototype had no consistent error envelope — every service just threw
 * strings. This gives every endpoint the same JSON shape on failure so the
 * client can display errors uniformly.
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: Record<string, string[]>) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

/**
 * Wraps a handler so validation failures, auth errors, and unexpected throws
 * all become clean JSON responses. The catch-all deliberately doesn't leak
 * the error message to the client — proposal requirement (NFR: "Errors must
 * not reveal system internals").
 */
export async function handle<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const value = await fn();
    if (value === undefined) return noContent();
    return ok(value);
  } catch (err) {
    if (err instanceof ZodError) {
      const details: Record<string, string[]> = {};
      for (const issue of err.errors) {
        const key = issue.path.join(".") || "_";
        (details[key] ??= []).push(issue.message);
      }
      return badRequest("Invalid input", details);
    }
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api] unhandled error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

/** Parse and validate a JSON request body against a Zod schema. */
export async function parseJson<S extends ZodTypeAny>(
  request: Request,
  schema: S
): Promise<z.infer<S>> {
  const body = await request.json().catch(() => ({}));
  return schema.parse(body);
}

/** Parse and validate URL search params. */
export function parseQuery<S extends ZodTypeAny>(
  request: Request,
  schema: S
): z.infer<S> {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    raw[k] = v;
  });
  return schema.parse(raw);
}
