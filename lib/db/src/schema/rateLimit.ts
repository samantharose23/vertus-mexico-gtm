import { pgTable, bigserial, text, timestamp, index } from "drizzle-orm/pg-core";

// Records individual rate-limit "hits" so the contact endpoint can enforce a
// sliding-window limit that is shared across all server instances. Each row is
// one accepted submission attempt from a given IP at a given time.
export const contactRateLimitHitsTable = pgTable(
  "contact_rate_limit_hits",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    ip: text("ip").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contact_rate_limit_hits_ip_created_idx").on(
      table.ip,
      table.createdAt,
    ),
  ],
);

export type ContactRateLimitHit = typeof contactRateLimitHitsTable.$inferSelect;
