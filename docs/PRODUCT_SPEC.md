FIXMYDAY — COMPLETE PRODUCT & ENGINEERING PROMPT

You are a senior product engineer, frontend architect, UX engineer, and AI engineer.

Build FixMyDay, a production-quality AI-powered personal life planner.

The goal is to create something that feels like a real premium SaaS product, not a demo, template, or generic todo application.

The product should be:

Beautiful → Fast → Smooth → Intelligent → Simple → Maintainable

The code should be written as if it will be maintained by a professional engineering team for the next 5+ years.

---

1. PRODUCT VISION

FixMyDay is an AI-powered personal planning application.

The core idea is:

«Tell me everything on your mind → AI understands it → AI organizes it → You get a realistic plan.»

It is NOT simply another todo application.

Example:

User enters:

«"Tomorrow I need to finish my PR, attend the team meeting, go to the gym, buy groceries, call my mom and spend one hour learning AI."»

FixMyDay should understand the intent and generate:

Tomorrow

09:30  Team meeting              Work       High
11:00  Finish PR                 Work       High
18:30  Gym                       Health     Medium
20:00  Buy groceries             Personal   Medium
21:00  Learn AI                  Learning   Low
21:45  Call Mom                  Personal   Medium

The user can then accept, modify, reorder, or ask AI to optimize the plan.

---

2. PRIMARY PRODUCT PRINCIPLE

The most important experience is:

THOUGHTS
   ↓
AI UNDERSTANDING
   ↓
STRUCTURED TASKS
   ↓
REALISTIC SCHEDULE
   ↓
ACTION

Everything else supports this experience.

Do not build 50 mediocre features.

Build a small number of features extremely well.

---

3. TARGET EXPERIENCE

The first impression should feel like:

«"This is a premium product."»

Visual inspiration can come from:

- Linear
- Raycast
- Arc
- Superhuman
- Notion Calendar

Do NOT copy their designs.

Create an original visual identity.

The interface should feel:

- Premium
- Minimal
- Calm
- Modern
- Futuristic
- Intelligent
- Fast
- Spacious
- Professional

Avoid:

- Generic dashboard layouts
- Bootstrap-like appearance
- Excessive gradients
- Excessive glassmorphism
- Huge colorful cards
- Excessive rounded corners
- Excessive animations
- Visual clutter
- Unnecessary UI elements

---

4. TECH STACK

Use:

- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Motion for animations
- Lucide icons
- PostgreSQL
- Neon
- Drizzle ORM
- Clerk authentication
- OpenAI API
- React Hook Form
- Zod

Use the latest stable versions compatible with each other.

Do not introduce unnecessary libraries.

Every dependency must have a clear reason to exist.

---

5. ARCHITECTURE

Use a feature-oriented architecture.

Preferred structure:

src/
│
├── app/
│   ├── (auth)/
│   │
│   ├── (dashboard)/
│   │   ├── today/
│   │   ├── tasks/
│   │   ├── calendar/
│   │   └── insights/
│   │
│   └── api/
│
├── features/
│   │
│   ├── tasks/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── planner/
│   │   ├── components/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── ai/
│   │   ├── components/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types/
│   │
│   ├── calendar/
│   └── insights/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── ai/
│   ├── validation/
│   └── utils/
│
├── hooks/
│
├── types/
│
└── config/

Do not create huge global folders containing hundreds of unrelated files.

Keep feature ownership clear.

---

6. ENGINEERING PHILOSOPHY

This is extremely important.

Write:

Simple code.

Not:

Clever code.

Prefer obvious code over abstraction-heavy code.

Do NOT optimize for:

- minimum lines
- maximum abstraction
- clever TypeScript
- unnecessary design patterns
- premature optimization

Optimize for:

- readability
- maintainability
- testability
- predictability
- debuggability
- modularity

A developer unfamiliar with the project should be able to understand a feature quickly.

---

7. COMPONENT DESIGN

Every component should have a clear responsibility.

Good:

TodayPage
 ├── TodayHeader
 ├── DailyProgress
 ├── TaskTimeline
 │    └── TaskItem
 ├── AIPlannerInput
 └── TaskDetailPanel

Bad:

TodayPage.tsx

containing:

- API calls
- database logic
- AI processing
- scheduling algorithms
- modal management
- task rendering
- notifications
- business logic

Avoid giant components.

At the same time, do not create meaningless micro-components just to reduce file size.

Find the practical middle ground.

---

8. BUSINESS LOGIC SEPARATION

Never mix everything together.

Preferred flow:

UI
 ↓
Hook / Action
 ↓
Service
 ↓
Repository / Database

For AI:

AI Input
 ↓
Planner Service
 ↓
AI Provider
 ↓
Structured Output
 ↓
Zod Validation
 ↓
Business Validation
 ↓
Task Service
 ↓
Database

UI components should not contain database logic.

---

9. TODAY PAGE

The primary application page is "/today".

Desktop layout:

┌─────────────────────────────────────────────────────┐
│ ✦ FixMyDay                         🔔       Avatar   │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│ Today        │ Good evening                        │
│ Tasks        │ Here's your plan                    │
│ Calendar     │                                      │
│ Insights     │ Today's progress                    │
│              │                                      │
│ ───────────  │ 4 of 6 completed                    │
│              │ ━━━━━━━━━━━━━━━○────                 │
│ Ask AI       │                                      │
│              │ Timeline                             │
│ ───────────  │                                      │
│ Settings     │ 09:30  Finish PR                     │
│              │ 11:00  Team meeting                  │
│              │ 18:30  Gym                           │
│              │ 20:00  Dinner                        │
│              │ 21:00  Learn AI                      │
│              │                                      │
│              │ ┌────────────────────────────────┐  │
│              │ │ What's on your mind?           │  │
│              │ └────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────┘

Keep the main workspace spacious.

---

10. AI CAPTURE INPUT

This is the signature component.

Large, beautiful input:

What's on your mind?

User can type natural language.

Example:

«"I need to finish my PR, go to gym, buy groceries and learn AI for an hour."»

On submit:

Show:

✦
Understanding your day...

Use subtle animation.

Then:

I've organized 4 things for you.

Tasks should animate into the timeline.

Actions:

[ Accept Plan ]
[ Edit ]
[ Reorganize ]

Do not immediately make destructive changes.

---

11. AI PLANNING

AI should:

- Extract tasks
- Identify dates
- Identify time references
- Identify priority
- Estimate duration
- Identify categories
- Detect dependencies
- Detect conflicts
- Suggest realistic scheduling
- Avoid impossible schedules
- Consider existing tasks

Example:

User:

«"Tomorrow morning finish my PR and go to the gym after work."»

AI:

09:30  Finish PR       Work      High
18:30  Gym             Health    Medium

AI should not invent unnecessary details.

When information is ambiguous, make reasonable assumptions and clearly show them.

---

12. AI STRUCTURED OUTPUT

Never trust raw AI output.

AI must return structured data.

Conceptually:

{
  "tasks": [
    {
      "title": "Finish PR",
      "category": "work",
      "priority": "high",
      "estimatedMinutes": 45,
      "scheduledStart": "09:30"
    }
  ]
}

Validate with Zod.

Pipeline:

AI
 ↓
Schema validation
 ↓
Business validation
 ↓
Database

Invalid AI output must never reach the database.

---

13. AI ASSISTANT

Create "/ask".

The user can ask:

«"I only have two hours tonight. What should I prioritize?"»

AI should inspect the user's tasks.

Example:

You have 5 things planned.

I'd prioritize:

1. Finish PR — 45 min
2. Gym — 60 min
3. AI learning — 30 min

I'd move groceries to tomorrow.

Provide:

[ Apply changes ]
[ Keep current plan ]

Never silently make major changes.

---

14. TASK SYSTEM

Each task supports:

- ID
- Title
- Description
- Category
- Priority
- Status
- Due date
- Scheduled start
- Estimated duration
- Tags
- Created timestamp
- Completed timestamp
- User ID

Categories:

- Work
- Personal
- Health
- Finance
- Learning
- Other

Priorities:

- Low
- Medium
- High
- Urgent

Statuses:

- Todo
- In progress
- Completed
- Cancelled

---

15. TASK INTERACTION

Clicking a task should open a beautiful detail panel.

Do not navigate away unnecessarily.

Allow:

- Edit
- Complete
- Reschedule
- Change priority
- Change category
- Delete
- Add notes

Use optimistic updates where safe.

After deletion:

Task deleted

[ Undo ]

---

16. TASKS PAGE

Create "/tasks".

Include:

- Search
- Filters
- Category filtering
- Priority filtering
- Status filtering
- Sorting
- Completed tasks
- Active tasks

Keep the UI simple.

Avoid creating a giant spreadsheet-like interface.

---

17. CALENDAR

Create "/calendar".

Start with:

- Day view
- Week view

Tasks appear on a timeline.

Support drag-and-drop rescheduling.

Use optimistic updates.

When a task moves:

Task moved

Persist the new time.

---

18. INSIGHTS

Create "/insights".

Show useful insights rather than meaningless charts.

Example:

This week

32 tasks completed

↑ 18% vs last week

Most productive:
Tuesday

Completion rate:
78%

Average task duration:
42 min

AI insight:

✦ Insight

You tend to complete learning tasks
more consistently after 7 PM.

Consider scheduling learning
between 7–9 PM.

Keep charts minimal.

---

19. COMMAND PALETTE

Implement:

⌘ K

Actions:

Create task
Ask AI
Go to Today
Go to Tasks
Go to Calendar
Go to Insights
Search tasks
Toggle theme

Keyboard shortcuts:

⌘ K   Command palette
N      New task
/      Search
Space  Complete selected task

Ensure shortcuts do not interfere with normal text input.

---

20. LANDING PAGE

Unauthenticated users see a premium landing page.

Hero:

Your thoughts are messy.

Your day doesn't have to be.

✦ FixMyDay turns everything on your mind
into a simple plan you can actually follow.

[ Start planning ]

Show an interactive demonstration:

User:

"Need to finish PR, gym,
groceries and study AI tonight."

        ↓

AI:

18:00 Finish PR
19:00 Gym
20:30 Groceries
21:15 AI Learning

Keep it visually impressive but restrained.

---

21. AUTHENTICATION

Use Clerk.

Authenticated routes must be protected.

Users must only access their own data.

Never trust a user ID coming from the client.

Always derive the authenticated user from the server-side authentication context.

---

22. DATABASE

Use PostgreSQL with Neon.

Use Drizzle ORM.

Suggested entities:

users
tasks
schedules
ai_conversations
ai_messages

Keep the schema normalized where appropriate.

Every user-owned entity must have ownership enforced.

Do not over-engineer the database.

---

23. DATA FETCHING

Keep fetching predictable.

Avoid:

Page
 ├── Component A → API
 ├── Component B → API
 ├── Component C → API
 └── Component D → API

Prefer:

Page
 ↓
Data fetching
 ↓
Feature components

Every async operation must handle:

Loading
Success
Empty
Error

---

24. STATE MANAGEMENT

Do not introduce a global state library unless genuinely required.

Prefer:

- Server state → server components / server-side fetching
- Local UI state → useState
- Forms → React Hook Form
- URL state → search params
- Shared client state → only where justified

Do not create a global store just because multiple components exist.

---

25. TYPESCRIPT

Use strict TypeScript.

Avoid "any".

Avoid unnecessary type gymnastics.

Use explicit domain types.

Keep types close to the feature that owns them.

Avoid duplicate type definitions.

---

26. VALIDATION

Use Zod for:

- Forms
- API input
- AI output
- Environment variables
- External data

Validate at boundaries.

Never trust client input.

Never trust AI output.

---

27. API AND SERVICES

Do not scatter API calls across UI components.

Bad:

fetch("/api/tasks")

inside multiple components.

Prefer:

taskService.getTasks()
taskService.createTask()
taskService.updateTask()
taskService.deleteTask()

Keep services feature-specific.

Do not create one giant:

apiService.ts

containing everything.

---

28. ERROR HANDLING

Handle:

- Network errors
- AI errors
- Database errors
- Validation errors
- Authentication errors
- Authorization errors
- Rate limits
- Unexpected errors

Never silently swallow errors.

Bad:

try {
  ...
} catch {}

User-facing errors should be understandable.

Developer logs should contain useful debugging context.

Never log secrets.

---

29. UI DESIGN SYSTEM

Build a consistent internal design system.

Use shadcn/ui as the base.

Define consistent:

- Typography
- Spacing
- Colors
- Borders
- Radii
- Shadows
- Motion
- Buttons
- Inputs
- Dialogs
- Dropdowns
- Badges
- Cards

Do not style every page independently.

---

30. DARK MODE

Dark mode is the default.

Do not use pure black everywhere.

Use subtle background layers.

Example hierarchy:

App background
↓
Sidebar background
↓
Card background
↓
Elevated surface

Implement light mode too.

Persist user preference.

---

31. ANIMATION

Use Motion.

Animations should feel:

- Smooth
- Fast
- Natural
- Purposeful

Use animation for:

- Page transitions
- Task creation
- Task completion
- AI processing
- Modal opening
- Command palette
- Drag/drop
- Toasts
- Progress changes

Avoid animation everywhere.

Respect:

prefers-reduced-motion

---

32. RESPONSIVE DESIGN

The product must work beautifully on:

- Desktop
- Laptop
- Tablet
- Mobile

Do not simply shrink desktop UI.

Mobile should be intentionally designed.

Mobile:

- Sidebar → drawer/bottom navigation
- AI input → primary floating action
- Task details → bottom sheet
- Timeline → compact vertical timeline

Touch targets must be appropriate.

---

33. ACCESSIBILITY

Accessibility is mandatory.

Use:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Proper labels
- ARIA where necessary
- Accessible dialogs
- Sufficient contrast
- Screen-reader-friendly controls
- Reduced motion

Do not use clickable "<div>" where a "<button>" should be used.

---

34. PERFORMANCE

Prioritize good architecture first.

Then optimize actual bottlenecks.

Watch for:

- Excessive client components
- Unnecessary renders
- Large bundles
- Duplicate requests
- Expensive calculations
- Large images
- Inefficient database queries

Do not use "useMemo" / "useCallback" everywhere without reason.

Do not prematurely optimize.

---

35. CODE STYLE

Use consistent formatting.

Prefer:

const isCompleted = task.status === "completed";

over complicated expressions.

Avoid:

- Deeply nested ternaries
- Huge functions
- Magic numbers
- Magic strings
- Clever abstractions
- Unnecessary generic utilities
- Over-engineered patterns

If something is complicated, simplify it.

---

36. NAMING

Use intention-revealing names.

Good:

createTask
calculateDailyProgress
getTasksForToday
handleTaskComplete
TaskTimeline
TaskDetailPanel

Bad:

processData
handleStuff
doThing
data2
temp
helper

---

37. COMMENTS

Do not comment obvious code.

Bad:

// Set loading to true
setLoading(true);

Good:

// Debounce planner requests so rapid edits do not
// create multiple AI plans.

Comments should explain why, not what.

---

38. FILE SIZE

Avoid giant files.

Guidelines:

- Components: preferably under 250 lines
- Hooks: preferably under 200 lines
- Services: preferably under 250 lines

These are guidelines, not strict rules.

Do not artificially split files just to satisfy these numbers.

Split when responsibility becomes unclear.

---

39. TESTING

Testing is part of implementation.

Use appropriate testing tools.

Unit tests

Test:

- Scheduling logic
- Priority calculations
- Date utilities
- Task transformations
- Validation
- Business rules

Component tests

Test user behavior:

- Create task
- Complete task
- Edit task
- Delete task
- Filter task
- Submit AI input
- Handle AI error

Integration tests

Test critical flows:

Create task
 ↓
Persist task
 ↓
Display task
 ↓
Complete task
 ↓
Update progress

Do not test implementation details unnecessarily.

Test behavior and outcomes.

---

40. SECURITY

Never expose:

- OpenAI API keys
- Database credentials
- Clerk secrets
- Internal tokens

to the browser.

All sensitive operations happen server-side.

Every mutation must verify:

Authentication
+
Authorization
+
Ownership
+
Input validation

Do not trust:

- Client user IDs
- URL parameters
- AI output
- Request payloads

---

41. ENVIRONMENT VARIABLES

Provide:

.env.example

Document required variables.

Example categories:

DATABASE_URL
OPENAI_API_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

Never commit real secrets.

Validate required environment variables.

---

42. EMPTY STATES

Create polished empty states.

Example:

✦

Nothing planned yet.

Tell me what's on your mind
and I'll organize your day.

[ Start planning ]

Do not show blank screens.

---

43. LOADING STATES

Never use generic loading spinners everywhere.

Prefer:

- Skeletons
- Shimmer
- Progressive content
- Subtle AI animations

The UI should feel responsive immediately.

---

44. ERROR STATES

Every major feature needs a useful error state.

Example:

Something went wrong.

We couldn't organize your plan.

[ Try again ]

Do not expose technical stack traces to users.

---

45. OPTIMISTIC UI

Use optimistic updates where the operation is safe.

Examples:

- Completing tasks
- Rescheduling tasks
- Updating priority
- Changing categories

For destructive operations, provide undo where appropriate.

---

46. DESIGN QUALITY BAR

Before considering the UI complete, check:

- Does spacing feel intentional?
- Is typography consistent?
- Are alignment and proportions correct?
- Are empty states polished?
- Are loading states polished?
- Are errors polished?
- Are transitions smooth?
- Does mobile feel intentional?
- Are there unnecessary borders?
- Are there unnecessary cards?
- Does anything feel visually noisy?
- Does the product feel premium?

If something looks generic, redesign it.

---

47. DEVELOPMENT PROCESS

Build incrementally.

Phase 1 — Foundation

Build:

- Project setup
- TypeScript
- Tailwind
- shadcn
- Theme
- Layout
- Sidebar
- Routing
- Design system

Then run:

typecheck
lint
build

Fix all issues.

---

Phase 2 — Today Experience

Build:

- Today page
- Timeline
- Task item
- Progress
- AI capture UI
- Mock planner
- Animations
- Responsive layout

Focus heavily on polish.

---

Phase 3 — Task System

Build:

- Database
- Drizzle schema
- Task CRUD
- Validation
- Authentication
- Authorization
- Task detail panel
- Search/filter

Add tests.

---

Phase 4 — AI

Build:

- AI service
- Structured output
- Zod validation
- Task extraction
- Scheduling
- AI assistant
- Error handling
- Rate-limit handling

Never trust raw AI output.

---

Phase 5 — Calendar

Build:

- Day view
- Week view
- Drag/drop
- Rescheduling
- Persistence

---

Phase 6 — Insights

Build:

- Productivity metrics
- Completion statistics
- AI insights
- Minimal charts

---

Phase 7 — Polish

Perform a full quality pass:

- UX
- Responsive
- Accessibility
- Performance
- Animations
- Error states
- Loading states
- Empty states
- Keyboard shortcuts
- Security
- Code quality

---

48. AUTONOMOUS DEVELOPMENT RULE

If you are operating as an autonomous coding agent:

Do not stop after creating the initial UI.

Continue through the complete implementation.

After each meaningful feature:

1. Run the application.
2. Run TypeScript checks.
3. Run lint.
4. Run relevant tests.
5. Fix errors.
6. Inspect the implementation.
7. Verify the user flow.
8. Check responsive behavior.
9. Continue only when the current stage is stable.

Do not leave known errors for later.

Do not say something is complete if it has not been verified.

---

49. BROWSER / UI VERIFICATION

When browser automation or visual inspection is available:

Test the actual application.

Verify:

- Landing page
- Authentication
- Today page
- Creating a task
- AI planning
- Accepting a plan
- Completing a task
- Editing a task
- Deleting a task
- Undo
- Calendar
- Insights
- Command palette
- Mobile layout
- Dark mode
- Light mode

Look for:

- Overflow
- Broken layouts
- Incorrect spacing
- Console errors
- Failed requests
- Loading issues
- Accessibility problems
- Animation glitches

Fix problems rather than simply documenting them.

---

50. GIT / CHANGE MANAGEMENT

Keep changes logically grouped.

Good commits:

feat: add task timeline
feat: add AI task extraction
feat: add calendar scheduling
fix: handle planner failure
refactor: separate task service from UI
test: add task completion coverage

Do not mix unrelated changes.

Avoid unnecessary formatting-only changes.

---

51. REFACTORING RULE

Before creating an abstraction ask:

«Will this make future development easier?»

Before duplicating code ask:

«Is this genuinely the same concept?»

Do not create abstractions simply because two pieces of code look similar.

Do not prematurely generalize.

---

52. DEFINITION OF DONE

A feature is complete only when:

✓ Functionality works
✓ UI is polished
✓ Responsive
✓ Accessible
✓ TypeScript passes
✓ Lint passes
✓ Tests pass
✓ Loading state exists
✓ Empty state exists
✓ Error state exists
✓ Authentication considered
✓ Authorization considered
✓ Input validated
✓ No obvious security issue
✓ No console errors
✓ No unnecessary API calls
✓ No obvious performance issue
✓ Code is readable
✓ Code is modular
✓ Code is maintainable

---

53. FINAL PRINCIPLE

When there are two valid implementations:

Choose the implementation that is:

1. Easier to understand
2. Easier to test
3. Easier to debug
4. Easier to modify
5. Less coupled
6. Less magical

Even if it requires more lines of code.

Do not write clever code. Write obvious code.

---

54. FINAL PRODUCT QUALITY BAR

The final result should feel like:

«A startup could launch this product tomorrow.»

Not:

«An AI generated a demo.»

The application must combine:

Premium UI
+
Excellent UX
+
Strong frontend architecture
+
Clean TypeScript
+
Modular features
+
Reliable AI integration
+
Proper validation
+
Testing
+
Security
+
Accessibility
+
Responsive design
+
Long-term maintainability

The signature experience must remain:

Thoughts → AI → Plan → Action

Build that experience exceptionally well.