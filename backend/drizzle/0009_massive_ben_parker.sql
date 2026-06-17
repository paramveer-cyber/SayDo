CREATE TYPE "public"."role" AS ENUM('user', 'bronze_subscriber', 'silver_subscriber', 'gold_subscriber', 'admin');--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gemini_api_key" text,
	"preferred_model" varchar(100) DEFAULT 'gemini-flash-lite-latest' NOT NULL,
	"use_local_model" boolean DEFAULT false NOT NULL,
	"approvals_required" boolean DEFAULT false NOT NULL,
	"prompts_asked" integer DEFAULT 0 NOT NULL,
	"system_prompt_override" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;