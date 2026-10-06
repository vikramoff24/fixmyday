import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";

import type { Database } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

/**
 * A real Postgres (PGlite, in-process) with the app's migrations applied.
 * Integration tests run the actual repositories and services against it.
 */
export async function createTestDatabase(): Promise<{ db: Database; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
  // The app's Database type is the postgres-js flavour; the query API is identical.
  return { db: db as unknown as Database, close: () => client.close() };
}
