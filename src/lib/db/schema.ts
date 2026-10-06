import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from "@/features/tasks/constants";
import type { AssistantProposal } from "@/features/ai/types";

export const taskCategoryEnum = pgEnum("task_category", TASK_CATEGORIES);
export const taskPriorityEnum = pgEnum("task_priority", TASK_PRIORITIES);
export const taskStatusEnum = pgEnum("task_status", TASK_STATUSES);
export const aiMessageRoleEnum = pgEnum("ai_message_role", ["user", "assistant"]);
export const proposalStatusEnum = pgEnum("ai_proposal_status", ["pending", "applied", "dismissed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * One row per authenticated user. The id is the auth provider's user id
 * (Clerk), so we never need to map between identifiers.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  /** Planning window, in minutes after local midnight. */
  dayStartMinute: integer("day_start_minute")
    .notNull()
    .default(9 * 60),
  dayEndMinute: integer("day_end_minute")
    .notNull()
    .default(22 * 60),
  ...timestamps,
});

/** A plan the user accepted from the AI planner — the "why" behind a group of tasks. */
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    input: text("input").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("plans_user_created_idx").on(table.userId, table.createdAt)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").references(() => plans.id, { onDelete: "set null" }),
    title: varchar("title", { length: TASK_TITLE_MAX_LENGTH }).notNull(),
    description: text("description"),
    category: taskCategoryEnum("category").notNull().default("other"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    status: taskStatusEnum("status").notNull().default("todo"),
    /** Calendar day the task belongs to, in the user's local time (YYYY-MM-DD). */
    dueDate: date("due_date", { mode: "string" }),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
    estimatedMinutes: integer("estimated_minutes"),
    tags: text("tags").array().notNull().default([]),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("tasks_user_scheduled_idx").on(table.userId, table.scheduledStart),
    index("tasks_user_due_idx").on(table.userId, table.dueDate),
    index("tasks_user_status_idx").on(table.userId, table.status),
  ],
);

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    ...timestamps,
  },
  (table) => [index("ai_conversations_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    // Denormalised owner so every message query can be scoped to the user directly.
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: aiMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    /** Changes the assistant suggested. Applied only after explicit confirmation. */
    proposal: jsonb("proposal").$type<AssistantProposal>(),
    proposalStatus: proposalStatusEnum("proposal_status"),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("ai_messages_conversation_created_idx").on(table.conversationId, table.createdAt)],
);

export type UserRow = typeof users.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
export type AiConversationRow = typeof aiConversations.$inferSelect;
export type AiMessageRow = typeof aiMessages.$inferSelect;
