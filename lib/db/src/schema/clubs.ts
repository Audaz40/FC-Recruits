import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clubsTable = pgTable("clubs", {
  id: serial("id").primaryKey(),
  captainId: integer("captain_id").notNull(),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  division: integer("division").notNull().default(5),
  style: text("style").notNull().default("casual"), // casual, competitive, semi-competitive
  country: text("country").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  playDays: text("play_days"), // JSON string
  playFrom: text("play_from"), // HH:MM
  playTo: text("play_to"), // HH:MM
  openPositions: text("open_positions"), // JSON string
  maxMembers: integer("max_members").default(11),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  draws: integer("draws").default(0),
  trustScore: integer("trust_score").notNull().default(50), // 0-100, starts at 50
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClubSchema = createInsertSchema(clubsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubsTable.$inferSelect;
