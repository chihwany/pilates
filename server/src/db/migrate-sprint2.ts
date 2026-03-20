import "dotenv/config";
import postgres from "postgres";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(databaseUrl);

async function migrate() {
  console.log("Sprint 2 Migration: Creating tables if not exist...");

  // Create sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "member_id" uuid NOT NULL,
      "instructor_id" uuid,
      "date" text NOT NULL,
      "condition_ai_raw" jsonb,
      "condition_final" jsonb,
      "condition_checked_at" text,
      "member_note" text,
      "requested_categories" jsonb DEFAULT '[]'::jsonb,
      "is_auto_generated" boolean DEFAULT false,
      "status" text DEFAULT 'pending' NOT NULL,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  console.log("  [OK] sessions table");

  // Create weekly_schedules table
  await sql`
    CREATE TABLE IF NOT EXISTS "weekly_schedules" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "member_id" uuid NOT NULL,
      "instructor_id" uuid NOT NULL,
      "day_of_week" integer NOT NULL,
      "start_time" text NOT NULL,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  console.log("  [OK] weekly_schedules table");

  // Add FK constraints (ignore if already exist)
  const fkStatements = [
    {
      name: "sessions_member_id_members_id_fk",
      sql: sql`ALTER TABLE "sessions" ADD CONSTRAINT "sessions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action`,
    },
    {
      name: "sessions_instructor_id_users_id_fk",
      sql: sql`ALTER TABLE "sessions" ADD CONSTRAINT "sessions_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`,
    },
    {
      name: "weekly_schedules_member_id_members_id_fk",
      sql: sql`ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action`,
    },
    {
      name: "weekly_schedules_instructor_id_users_id_fk",
      sql: sql`ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`,
    },
  ];

  for (const fk of fkStatements) {
    try {
      await fk.sql;
      console.log(`  [OK] FK ${fk.name}`);
    } catch (err: any) {
      if (err.code === "42710") {
        // constraint already exists
        console.log(`  [SKIP] FK ${fk.name} already exists`);
      } else {
        throw err;
      }
    }
  }

  console.log("Sprint 2 Migration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
