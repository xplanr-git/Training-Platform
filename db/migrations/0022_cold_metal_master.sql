CREATE TABLE IF NOT EXISTS "help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text,
	"message" text NOT NULL,
	"path" text,
	"course_slug" text,
	"course_title" text,
	"topic_title" text,
	"learning_item" text,
	"audience" "audience",
	"delivery_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "required_for_audiences" "audience"[];--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "audiences" "audience"[];--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_requests_tenant_idx" ON "help_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_requests_tenant_created_idx" ON "help_requests" USING btree ("tenant_id","created_at");--> statement-breakpoint
-- SECURITY (see 0014): help_requests holds learner PII (email + message body).
-- Default privileges grant SELECT on every NEW table to `authenticated`, and
-- PostgREST exposes all tables — so without this, any learner could read every
-- tenant's help requests over the REST API. This table has NO client access
-- path: the app reads and writes it only through the privileged server
-- connection (which, as owner/service_role, bypasses both RLS and these grants).
-- Enable RLS (deny-by-default, no policy) AND revoke the REST grants — two
-- independent layers, matching 0014's belt-and-braces reasoning.
ALTER TABLE "help_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON "help_requests" FROM authenticated, anon;
