CREATE TYPE "public"."audience" AS ENUM('installer', 'dealer', 'distributor', 'staff', 'other');--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "audience" "audience";