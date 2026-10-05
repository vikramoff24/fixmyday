import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";

/** Liveness + database reachability check for uptime monitors and deploys. */
export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[health] database check failed", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
