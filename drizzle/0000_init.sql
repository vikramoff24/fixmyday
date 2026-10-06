CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."ai_proposal_status" AS ENUM('pending', 'applied', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('work', 'personal', 'health', 'finance', 'learning', 'other');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"content" text NOT NULL,
	"proposal" jsonb,
	"proposal_status" "ai_proposal_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"input" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category" "task_category" DEFAULT 'other' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"due_date" date,
	"scheduled_start" timestamp with time zone,
	"estimated_minutes" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"day_start_minute" integer DEFAULT 540 NOT NULL,
	"day_end_minute" integer DEFAULT 1320 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_conversations_user_updated_idx" ON "ai_conversations" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_created_idx" ON "ai_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "plans_user_created_idx" ON "plans" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "tasks_user_scheduled_idx" ON "tasks" USING btree ("user_id","scheduled_start");--> statement-breakpoint
CREATE INDEX "tasks_user_due_idx" ON "tasks" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "tasks_user_status_idx" ON "tasks" USING btree ("user_id","status");