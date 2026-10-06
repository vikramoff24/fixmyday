# FixMyDay

> Your thoughts are messy. Your day doesn't have to be.

FixMyDay is an AI-powered personal planner. Tell it everything on your mind — it understands it, organizes it, and turns it into a realistic plan you can actually follow.

**Thoughts → AI → Plan → Action**

```
"Tomorrow I need to finish my PR, attend the team meeting, go to the gym,
 buy groceries, call my mom and spend one hour learning AI."

Tomorrow · Tuesday, October 6
09:00  Finish PR                 Work       High     1 h 30 min
10:45  Attend the team meeting   Work       High     1 h
18:00  Gym                       Health     Medium   1 h
19:15  Buy groceries             Personal   Medium   45 min
20:15  Call Mom                  Personal   Medium   20 min
21:00  Learn AI                  Learning   Low      1 h

[ Accept plan ]  [ Edit ]  [ Reorganize ]
```

## Features

| Area           | What you get                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Today**      | AI capture input, editable plan drafts, timeline with a live "now" marker, progress, carried-over tasks, detail panel with optimistic edits and undoable delete.   |
| **AI planner** | Extracts tasks, dates, times, priorities, durations, categories and dependencies; schedules them around existing tasks; reports assumptions and conflicts.         |
| **Ask AI**     | "I only have two hours tonight — what should I prioritize?" Answers from your tasks and proposes changes you apply (or keep) explicitly.                           |
| **Tasks**      | Search, active/completed/all, category and priority filters, sorting — all in the URL.                                                                             |
| **Calendar**   | Day and week views, overlap-aware layout, drag-and-drop (or arrow-key) rescheduling with optimistic updates.                                                       |
| **Insights**   | Completed vs. the same point last week, completion rate, most productive day, average task length, a minimal chart and a pattern-based insight.                    |
| **Everywhere** | ⌘K command palette, keyboard shortcuts, dark (default) and light themes, mobile layout with bottom navigation and a planner FAB, WCAG AA contrast, reduced motion. |

Keyboard: `⌘K` palette · `N` new task · `/` search · `J`/`K` or `↑`/`↓` select · `Space` complete · `Enter` open. Bare-key shortcuts never fire while typing or inside dialogs.

## Quick start

Requirements: Node.js 20.9+ and PostgreSQL (local, Docker, or [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env.local      # set DATABASE_URL at minimum
npm run db:migrate              # create the schema
npm run db:seed                 # optional: 4 weeks of demo history
npm run dev                     # http://localhost:3000
```

### Zero-credential development

You can run the whole product with only a database:

- **No Clerk keys** → you're signed in as a local _dev user_. This mode is development-only: env validation refuses to start a production server without Clerk.
- **No OpenAI key** → planning and Ask AI use built-in rule-based fallbacks with the same validation and UI, so every flow works offline. Plans show a subtle "Built-in planner" label.

## Environment variables

See [`.env.example`](.env.example). All server variables are validated with Zod on first use ([`src/config/env.ts`](src/config/env.ts)).

| Variable                            | Required          | Purpose                                                          |
| ----------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`                      | Yes               | Postgres connection string (use Neon's _pooled_ string in prod). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production        | Clerk publishable key.                                           |
| `CLERK_SECRET_KEY`                  | Production        | Clerk secret key (server only).                                  |
| `OPENAI_API_KEY`                    | For AI            | Enables the AI planner and assistant (server only).              |
| `OPENAI_MODEL`                      | No (`gpt-5-mini`) | Any model that supports structured outputs.                      |

Secrets are only read on the server; nothing sensitive is exposed via `NEXT_PUBLIC_*`.

## Scripts

| Script                            | What it does                                             |
| --------------------------------- | -------------------------------------------------------- |
| `npm run dev` / `build` / `start` | Next.js                                                  |
| `npm run check`                   | Typecheck + lint + format check + unit/integration tests |
| `npm test`                        | Vitest (unit, component, PGlite-backed integration)      |
| `npm run test:e2e`                | Playwright end-to-end + axe accessibility checks         |
| `npm run db:generate`             | Generate a migration from schema changes                 |
| `npm run db:migrate`              | Apply migrations                                         |
| `npm run db:seed`                 | Seed demo history for the local dev user                 |
| `npm run format`                  | Prettier (with Tailwind class sorting)                   |

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui on Radix · Motion · Lucide · PostgreSQL (Neon) · Drizzle ORM · Clerk · OpenAI · React Hook Form · Zod.

```
src/
├── app/                     Routes only: fetch data on the server, render a feature view
│   ├── (auth)/              Clerk sign-in / sign-up
│   ├── (dashboard)/         today · tasks · calendar · insights · ask · settings
│   └── api/health/          Liveness + database check
├── features/                Each feature owns its UI, logic, validation and data access
│   ├── tasks/               components · hooks · services · schemas · utils · actions.ts
│   ├── planner/             AI planning: understanding, scheduling, drafts, accept
│   ├── ai/                  Ask AI assistant: conversations, proposals
│   ├── calendar/            Time grid, overlap layout, drag-to-reschedule
│   ├── insights/            Metrics + pattern detection
│   ├── settings/            Users, planning hours, theme
│   └── marketing/           Landing page demo
├── components/              ui/ (design system) · layout/ (app shell) · shared/ · providers/
├── lib/                     db/ · auth/ · ai/ · validation/ · utils/ · errors · action results
├── hooks/                   Cross-feature hooks (shortcuts, media queries, clock)
└── config/                  Env validation, feature flags, navigation, site config
```

### Data flow

```
Page (server component)  →  feature service  →  repository  →  Postgres
          ↓ props
Feature view (client)    →  useOptimistic…   →  server action  →  service  →  repository
```

- Pages fetch once on the server and pass data down; components don't fetch.
- Mutations are server actions (`features/*/actions.ts`). Each one authenticates, delegates validation and rules to a service, and calls `refresh()` so server data stays the source of truth. Failures return a typed `ActionResult` with a user-safe message — never a stack trace.
- Client state is local (`useState`, `useOptimistic`) or in the URL (filters, calendar view). There is no global store.

### The AI pipeline

```
User text ─▶ Planner service ─▶ OpenAI (structured output, JSON schema from Zod)
                                    │
                    Zod schema validation  (shape)        ─▶ reject: AI_INVALID_OUTPUT
                                    │
                    Business validation (normalizeAiPlan) ─▶ repair or drop: past dates,
                                    │                        absurd durations, bad times,
                                    │                        dangling dependencies
                    Deterministic scheduler (schedulePlan)
                                    │
                         Plan draft ─▶ user edits / reorganizes ─▶ Accept
                                                                     │
                                          Zod re-validation (it came back from the client)
                                                                     │
                                                       Plan + tasks in one transaction
```

The model _understands_; code _schedules_. Exact times come only from the user; everything else is placed by a tested scheduler that works around existing tasks, adds buffers, respects dependencies, never schedules in the past, and explains anything it moved.

The assistant follows the same rules: tasks are shown to the model under short refs (`T1`, `T2`…), never database ids; suggestions referencing anything else are dropped; proposals are stored server-side and applying one reads the stored proposal, claims it exactly once, and routes each change through the task service.

### Security model

- Identity always comes from the server session (`requireUserId`); client-supplied user ids are never accepted.
- Every repository query filters by owner — a foreign task id behaves exactly like a missing one.
- Every server action validates input with Zod; services validate again before touching the database.
- AI output and client-returned drafts are untrusted and re-validated.
- AI requests are rate-limited per user (in-process; swap for a shared store if you run many instances).
- Security headers on every response; production refuses to start without Clerk.

### Time zones

Dates are stored as local calendar days (`due_date`) plus UTC instants (`scheduled_start`). The browser reports its IANA time zone via a cookie, so "today" on the server is the user's today. All conversion lives in [`src/lib/utils/zoned-time.ts`](src/lib/utils/zoned-time.ts) (DST-tested).

## Testing

- **Unit** — scheduling, offline understanding, AI output normalisation, assistant logic, time-zone utilities, task rules, schemas, insights, rate limiting, the OpenAI boundary.
- **Component** — planning, editing a draft, AI errors and retry, completing (optimistic + revert on failure), editing, deleting with undo, keyboard shortcuts, new-task validation, filters.
- **Integration** — real services against in-process Postgres (PGlite) with the real migrations: persistence, progress, ownership isolation, plan acceptance, applying assistant suggestions exactly once.
- **End-to-end** — Playwright through the real UI plus axe WCAG 2.1 AA checks on every page, on desktop and mobile.

## Deployment

1. Create a Neon database and run `npm run db:migrate` against it.
2. Create a Clerk application; set both Clerk keys.
3. Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`).
4. Deploy to Vercel (or any Node host). `npm run build` needs no secrets.

## Roadmap

- [x] Phase 1 — Foundation (setup, design system, layout, routing)
- [x] Phase 2 — Today experience (timeline, progress, AI capture UI)
- [x] Phase 3 — Task system (DB, CRUD, auth, detail panel, filters)
- [x] Phase 4 — AI (structured planning, validation, `/ask` assistant)
- [x] Phase 5 — Calendar (day/week views, drag-to-reschedule)
- [x] Phase 6 — Insights
- [x] Phase 7 — Polish (a11y, responsive, performance, security)

The full product and engineering spec lives in [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md).
