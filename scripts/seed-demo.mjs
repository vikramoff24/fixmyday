/**
 * Seeds four weeks of realistic history for the local dev user so Today,
 * Calendar and Insights have something to show. Development only.
 *
 *   npm run db:seed            (uses DATABASE_URL from .env.local)
 *   SEED_USER_ID=user_123 npm run db:seed
 */
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production.");

const userId = process.env.SEED_USER_ID ?? "local-dev-user";
const timeZone = process.env.SEED_TIME_ZONE ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
const sql = postgres(databaseUrl, { prepare: false });

const TEMPLATES = [
  { title: "Review pull requests", category: "work", priority: "high", minutes: 45, hour: 10 },
  { title: "Write project update", category: "work", priority: "medium", minutes: 30, hour: 11 },
  { title: "Deep work: feature build", category: "work", priority: "high", minutes: 120, hour: 9 },
  { title: "Gym", category: "health", priority: "medium", minutes: 60, hour: 18 },
  { title: "Morning run", category: "health", priority: "medium", minutes: 40, hour: 7 },
  { title: "Learn AI: course module", category: "learning", priority: "low", minutes: 45, hour: 20 },
  { title: "Read 20 pages", category: "learning", priority: "low", minutes: 30, hour: 21 },
  { title: "Groceries", category: "personal", priority: "medium", minutes: 40, hour: 19 },
  { title: "Call family", category: "personal", priority: "medium", minutes: 20, hour: 20 },
  { title: "Review budget", category: "finance", priority: "medium", minutes: 25, hour: 13 },
];

function dateKeyFor(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// The instant when the wall clock in `timeZone` reads `dateKey` at hour:minute.
function zonedTime(dateKey, hour, minute) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
      .formatToParts(guess)
      .map((part) => [part.type, Number(part.value)]),
  );
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return new Date(guess.getTime() - (wallAsUtc - guess.getTime()));
}

// Deterministic pseudo-random numbers so every seed looks the same.
let state = 42;
function random() {
  state = (state * 1103515245 + 12345) % 2 ** 31;
  return state / 2 ** 31;
}

const rows = [];
const now = new Date();
for (let daysAgo = 27; daysAgo >= 1; daysAgo--) {
  const day = new Date(now.getTime() - daysAgo * 86_400_000);
  const count = 2 + Math.floor(random() * 4);
  const usedTitles = new Set();
  for (let index = 0; index < count; index++) {
    const template = TEMPLATES[Math.floor(random() * TEMPLATES.length)];
    if (usedTitles.has(template.title)) continue;
    usedTitles.add(template.title);
    const start = zonedTime(dateKeyFor(day), template.hour, random() > 0.5 ? 30 : 0);
    // Most past tasks get done; a few are left open to show "carried over".
    const done = random() < (daysAgo > 3 ? 0.95 : 0.7);
    const completedAt = done ? new Date(start.getTime() + (template.minutes + 10) * 60_000) : null;
    rows.push({
      user_id: userId,
      title: template.title,
      category: template.category,
      priority: template.priority,
      status: done ? "completed" : "todo",
      due_date: dateKeyFor(start),
      scheduled_start: start,
      estimated_minutes: template.minutes,
      completed_at: completedAt,
      created_at: new Date(start.getTime() - 86_400_000),
    });
  }
}

await sql`insert into users (id) values (${userId}) on conflict do nothing`;
await sql`delete from tasks where user_id = ${userId} and title in ${sql(TEMPLATES.map((template) => template.title))}`;
await sql`insert into tasks ${sql(rows)}`;
console.log(`Seeded ${rows.length} tasks for ${userId} (${timeZone}).`);
await sql.end();
