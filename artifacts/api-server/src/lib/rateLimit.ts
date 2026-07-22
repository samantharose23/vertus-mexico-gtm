import { db, contactRateLimitHitsTable } from "@workspace/db";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { logger } from "./logger";

// Sliding-window per-IP rate limiter backed by a shared Postgres table so the
// limit holds across every server instance (unlike a per-process in-memory
// counter, whose effective limit multiplies when the deployment scales out).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

// If the database is briefly unavailable we fall back to a per-process in-memory
// window so the public contact form keeps working. This is best-effort and only
// engages on DB errors; the shared store remains the primary mechanism.
const fallbackHits = new Map<string, number[]>();

function fallbackRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (fallbackHits.get(ip) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );
  if (recent.length >= MAX_PER_WINDOW) {
    fallbackHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  fallbackHits.set(ip, recent);
  return false;
}

// Throttle DB-error logging so a sustained outage cannot flood the logs.
let lastErrorLoggedAt = 0;
function logStoreError(err: unknown): void {
  const now = Date.now();
  if (now - lastErrorLoggedAt >= WINDOW_MS) {
    lastErrorLoggedAt = now;
    logger.error(
      { err },
      "Rate limit store unavailable; using in-memory fallback",
    );
  }
}

/**
 * Returns true when the IP has already reached the limit within the current
 * window (and the request should be rejected with 429). Otherwise records the
 * hit and returns false.
 *
 * The count-then-insert runs inside a transaction guarded by a per-IP advisory
 * lock (`pg_advisory_xact_lock`), so concurrent requests from the same IP are
 * serialized and cannot each slip under the threshold. The lock is released
 * automatically when the transaction commits or rolls back.
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS);
  try {
    return await db.transaction(async (tx) => {
      // int returned by hashtext is implicitly widened to the bigint arg.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${ip}))`);

      const [row] = await tx
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(contactRateLimitHitsTable)
        .where(
          and(
            eq(contactRateLimitHitsTable.ip, ip),
            gt(contactRateLimitHitsTable.createdAt, windowStart),
          ),
        );

      if ((row?.count ?? 0) >= MAX_PER_WINDOW) {
        return true;
      }

      await tx.insert(contactRateLimitHitsTable).values({ ip });
      return false;
    });
  } catch (err) {
    logStoreError(err);
    return fallbackRateLimited(ip);
  }
}

// Periodically evict rows that have aged out of the window to bound table
// growth. Runs on every instance; deletes are idempotent so overlap is fine.
const CLEANUP_INTERVAL_MS = 5 * WINDOW_MS;
setInterval(() => {
  const cutoff = new Date(Date.now() - WINDOW_MS);
  db.delete(contactRateLimitHitsTable)
    .where(lt(contactRateLimitHitsTable.createdAt, cutoff))
    .catch((err) => {
      logger.error({ err }, "Failed to prune contact_rate_limit_hits");
    });
}, CLEANUP_INTERVAL_MS).unref();
