import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, playersTable, clubsTable, tryoutsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/platform", async (_req, res): Promise<void> => {
  const [totalPlayers, totalClubs, totalTryouts, freeAgents] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(playersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(clubsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(tryoutsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(playersTable).where(eq(playersTable.freeAgent, true)),
  ]);

  const byPlatformRaw = await db.select({
    platform: playersTable.platform,
    count: sql<number>`count(*)::int`,
  }).from(playersTable).groupBy(playersTable.platform);

  const byPositionRaw = await db.select({
    position: playersTable.mainPosition,
    count: sql<number>`count(*)::int`,
  }).from(playersTable).groupBy(playersTable.mainPosition).orderBy(sql`count(*) desc`).limit(10);

  // Active clubs = clubs with at least one open position
  const [activeClubs] = await db.select({ count: sql<number>`count(*)::int` })
    .from(clubsTable)
    .where(sql`${clubsTable.openPositions} IS NOT NULL AND ${clubsTable.openPositions} != '[]' AND ${clubsTable.openPositions} != ''`);

  res.json({
    totalPlayers: totalPlayers[0]?.count ?? 0,
    totalClubs: totalClubs[0]?.count ?? 0,
    totalTryouts: totalTryouts[0]?.count ?? 0,
    freeAgents: freeAgents[0]?.count ?? 0,
    activeClubs: activeClubs?.count ?? 0,
    byPlatform: byPlatformRaw.map(r => ({ platform: r.platform, count: r.count })),
    byPosition: byPositionRaw.map(r => ({ position: r.position ?? "Unknown", count: r.count })),
  });
});

export default router;
