import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterUserId: text("reporter_user_id").notNull(),
  targetType: text("target_type").notNull(), // "player", "club", "tryout"
  targetId: integer("target_id").notNull(),
  category: text("category").notNull(), // "spam", "offensive", "fake_info", "impersonation", "other"
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "reviewed", "resolved", "dismissed"
  reviewedBy: text("reviewed_by"), // admin user id
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
