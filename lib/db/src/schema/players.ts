import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  gamertag: text("gamertag").notNull(),
  displayName: text("display_name"),
  platform: text("platform").notNull(), // PS5, Xbox, PC
  mainPosition: text("main_position").notNull(),
  secondaryPosition: text("secondary_position"),
  overallRating: integer("overall_rating").notNull().default(75),
  goals: integer("goals"),
  assists: integer("assists"),
  passAccuracy: real("pass_accuracy"),
  cleanSheets: integer("clean_sheets"),
  matchesPlayed: integer("matches_played"),
  country: text("country").notNull(),
  timezone: text("timezone").notNull(),
  availableDays: text("available_days"), // JSON string
  availableFrom: text("available_from"), // HH:MM
  availableTo: text("available_to"), // HH:MM
  bio: text("bio"),
  freeAgent: boolean("free_agent").notNull().default(true),
  clubId: integer("club_id"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
