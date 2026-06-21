import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tryoutsTable = pgTable("tryouts", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull(),
  playerId: integer("player_id").notNull(),
  initiatedBy: text("initiated_by").notNull(), // player or club
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, scheduled, completed, cancelled
  scheduledAt: text("scheduled_at"), // ISO datetime string
  message: text("message"),
  playerRatingScore: real("player_rating_score"),
  clubRatingScore: real("club_rating_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTryoutSchema = createInsertSchema(tryoutsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTryout = z.infer<typeof insertTryoutSchema>;
export type Tryout = typeof tryoutsTable.$inferSelect;
