import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, reportsTable, playersTable, clubsTable } from "@workspace/db";
import { strictRateLimit } from "../middlewares/rateLimit";
import { adjustTrustScore, adjustClubTrustScore } from "../middlewares/trustScore";

const router: IRouter = Router();

function getUserId(req: any): string | null {
  return (req.headers["x-user-id"] as string) || null;
}

// Create a report
router.post("/reports", strictRateLimit, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "X-User-Id header required" });
    return;
  }

  const { targetType, targetId, category, description } = req.body;

  // Validate required fields
  if (!targetType || !targetId || !category || !description) {
    res.status(400).json({ error: "targetType, targetId, category, and description are required" });
    return;
  }

  // Validate targetType
  const validTargetTypes = ["player", "club", "tryout"];
  if (!validTargetTypes.includes(targetType)) {
    res.status(400).json({ error: "Invalid targetType. Must be player, club, or tryout" });
    return;
  }

  // Validate category
  const validCategories = ["spam", "offensive", "fake_info", "impersonation", "other"];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }

  // Validate description length
  if (description.length < 10 || description.length > 1000) {
    res.status(400).json({ error: "Description must be between 10 and 1000 characters" });
    return;
  }

  // Check if target exists
  if (targetType === "player") {
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, Number(targetId)));
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
  } else if (targetType === "club") {
    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, Number(targetId)));
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
  }

  // Check if user already reported this target
  const existing = await db.select().from(reportsTable).where(
    and(
      eq(reportsTable.reporterUserId, userId),
      eq(reportsTable.targetType, targetType),
      eq(reportsTable.targetId, Number(targetId))
    )
  );

  if (existing.length > 0) {
    res.status(409).json({ error: "You have already reported this item" });
    return;
  }

  const [report] = await db.insert(reportsTable).values({
    reporterUserId: userId,
    targetType,
    targetId: Number(targetId),
    category,
    description,
    status: "pending",
  }).returning();

  res.status(201).json(report);
});

// List all reports (admin only - for now, no auth check)
router.get("/reports", async (req, res): Promise<void> => {
  const { status, limit = 50, offset = 0 } = req.query;

  const conditions: any[] = [];
  if (status) {
    conditions.push(eq(reportsTable.status, status as string));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const reports = await db.select()
    .from(reportsTable)
    .where(where)
    .orderBy(desc(reportsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json({ reports, total: reports.length });
});

// Get a specific report
router.get("/reports/:id", async (req, res): Promise<void> => {
  const raw = req.params.id;
  const id = parseInt(raw as string, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(report);
});

// Update report status (admin only)
router.patch("/reports/:id", strictRateLimit, async (req, res): Promise<void> => {
  const raw = req.params.id;
  const id = parseInt(raw as string, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { status, reviewedBy } = req.body;

  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [report] = await db.update(reportsTable)
    .set({
      status,
      reviewedBy: reviewedBy || null,
      reviewedAt: new Date(),
    })
    .where(eq(reportsTable.id, id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  // If report is resolved as valid, decrease trust score
  if (status === "resolved") {
    if (report.targetType === "player") {
      const [player] = await db.select().from(playersTable).where(eq(playersTable.id, report.targetId));
      if (player) {
        await adjustTrustScore(player.userId, -10, `Report resolved: ${report.category}`);
      }
    } else if (report.targetType === "club") {
      await adjustClubTrustScore(report.targetId, -10, `Report resolved: ${report.category}`);
    }
  }

  res.json(report);
});

export default router;
