import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/config/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

// Reuse one connection pool across hot reloads in development; otherwise every
// file save would open a new pool and eventually exhaust connections.
const globalForDb = globalThis as unknown as { fixMyDayDb?: Database };

/**
 * postgres.js works with Neon's pooled connection string as well as any local
 * Postgres. `prepare: false` keeps it compatible with transaction-mode poolers.
 */
export function getDb(): Database {
  if (globalForDb.fixMyDayDb) return globalForDb.fixMyDayDb;

  const { DATABASE_URL } = getServerEnv();
  const sql = postgres(DATABASE_URL, { prepare: false, max: 10 });
  const db = drizzle(sql, { schema });

  globalForDb.fixMyDayDb = db;
  return db;
}
