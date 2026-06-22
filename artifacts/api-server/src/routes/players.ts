import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql, desc, like, or } from "drizzle-orm";
import { db, playersTable, clubsTable, ratingsTable, tryoutsTable } from "@workspace/db";
import {
  ListPlayersQueryParams,
  CreatePlayerBody,
  GetPlayerParams,
  UpdatePlayerParams,
  UpdatePlayerBody,
} from "@workspace/api-zod";
import { strictRateLimit, searchRateLimit } from "../middlewares/rateLimit";
import { validatePlayerInput } from "../lib/validation";

const router: IRouter = Router();

function getUserId(req: any): string | null {
  return (req.headers["x-user-id"] as string) || null;
}

async function enrichPlayer(player: any) {
  let clubName: string | null = null;
  if (player.clubId) {
    const [club] = await db.select({ name: clubsTable.name }).from(clubsTable).where(eq(clubsTable.id, player.clubId));
    clubName = club?.name ?? null;
  }

  const ratings = await db.select({ score: ratingsTable.score }).from(ratingsTable)
    .innerJoin(tryoutsTable, eq(tryoutsTable.id, ratingsTable.tryoutId))
    .where(and(eq(tryoutsTable.playerId, player.id), eq(ratingsTable.ratedBy, "club")));

  const totalRatings = ratings.length;
  const averageRating = totalRatings > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.score, 0) / totalRatings
    : null;

  return {
    ...player,
    clubName,
    averageRating,
    totalRatings,
    createdAt: player.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.get("/players", searchRateLimit, async (req, res): Promise<void> => {
  const params = ListPlayersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { position, platform, country, timezone, minRating, maxRating, available, freeAgent, search, limit = 20, offset = 0 } = params.data;

  const conditions: any[] = [];
  if (position) conditions.push(or(eq(playersTable.mainPosition, position), eq(playersTable.secondaryPosition, position)));
  if (platform) conditions.push(eq(playersTable.platform, platform));
  if (country) conditions.push(eq(playersTable.country, country));
  if (timezone) conditions.push(eq(playersTable.timezone, timezone));
  if (minRating !== undefined) conditions.push(gte(playersTable.overallRating, minRating));
  if (maxRating !== undefined) conditions.push(lte(playersTable.overallRating, maxRating));
  if (freeAgent === true || available === true) conditions.push(eq(playersTable.freeAgent, true));
  if (search) conditions.push(like(playersTable.gamertag, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [players, countResult] = await Promise.all([
    db.select().from(playersTable).where(where).orderBy(desc(playersTable.overallRating)).limit(Number(limit)).offset(Number(offset)),
    db.select({ count: sql<number>`count(*)::int` }).from(playersTable).where(where),
  ]);

  const enriched = await Promise.all(players.map(enrichPlayer));
  res.json({ players: enriched, total: countResult[0]?.count ?? 0 });
});

router.post("/players", strictRateLimit, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "X-User-Id header required" });
    return;
  }

  const existing = await db.select().from(playersTable).where(eq(playersTable.userId, userId));
  if (existing.length > 0) {
    res.status(409).json({ error: "Player profile already exists" });
    return;
  }

  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Additional validation for security
  const additionalValidation = validatePlayerInput(parsed.data);
  if (!additionalValidation.success) {
    res.status(400).json({ error: additionalValidation.error.message });
    return;
  }

  const [player] = await db.insert(playersTable).values({ ...parsed.data, userId }).returning();
  const enriched = await enrichPlayer(player);
  res.status(201).json(enriched);
});

router.get("/players/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "X-User-Id header required" });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, userId));
  if (!player) {
    res.status(404).json({ error: "No player profile found" });
    return;
  }

  const enriched = await enrichPlayer(player);
  res.json(enriched);
});

router.get("/players/featured", async (req, res): Promise<void> => {
  const players = await db.select().from(playersTable)
    .where(eq(playersTable.freeAgent, true))
    .orderBy(desc(playersTable.overallRating))
    .limit(8);

  const enriched = await Promise.all(players.map(enrichPlayer));
  res.json({ players: enriched, total: enriched.length });
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const enriched = await enrichPlayer(player);
  res.json(enriched);
});

router.patch("/players/:id", strictRateLimit, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = getUserId(req);
  const [existing] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Additional validation for security
  const additionalValidation = validatePlayerInput(parsed.data);
  if (!additionalValidation.success) {
    res.status(400).json({ error: additionalValidation.error.message });
    return;
  }

  const [player] = await db.update(playersTable).set(parsed.data).where(eq(playersTable.id, params.data.id)).returning();
  const enriched = await enrichPlayer(player);
  res.json(enriched);
});

export default router;
