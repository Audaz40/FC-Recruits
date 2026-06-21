import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  UpdateNotificationParams,
  UpdateNotificationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getUserId(req: any): string | null {
  return (req.headers["x-user-id"] as string) || null;
}

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.json({ notifications: [], unreadCount: 0 });
    return;
  }

  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  const [unreadResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));

  res.json({
    notifications: notifications.map(n => ({ ...n, createdAt: n.createdAt?.toISOString() ?? new Date().toISOString() })),
    unreadCount: unreadResult?.count ?? 0,
  });
});

router.patch("/notifications/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateNotificationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [notification] = await db.update(notificationsTable)
    .set(parsed.data)
    .where(eq(notificationsTable.id, params.data.id))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({ ...notification, createdAt: notification.createdAt?.toISOString() ?? new Date().toISOString() });
});

export default router;
