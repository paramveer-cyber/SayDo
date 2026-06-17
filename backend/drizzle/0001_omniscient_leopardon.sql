CREATE TYPE "public"."provider" AS ENUM('local', 'google');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"avatar_url" text,
	"password_salt" text,
	"password_hash" text,
	"provider" "provider" DEFAULT 'local' NOT NULL,
	"provider_id" varchar(255),
	"refresh_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
