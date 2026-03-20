import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["instructor", "member"]);

// ===== users 테이블 =====
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  name: varchar("name", { length: 100 }).notNull(),
  pushToken: text("push_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== members 테이블 =====
export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  bodyConditions: jsonb("body_conditions").default([]),
  exercisePreferences: jsonb("exercise_preferences").default({}),
  fitnessLevel: text("fitness_level").notNull().default("beginner"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
