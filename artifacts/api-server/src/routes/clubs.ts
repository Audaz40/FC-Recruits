import { Router, type IRouter } from "express";
import { eq, and, sql, desc, like, or } from "drizzle-orm";
import { db, clubsTable, playersTable, membersTable } from "@workspace/db";
import {
  ListClubsQueryParams,
  CreateClubBody,
  GetClubParams,
  UpdateClubParams,
  UpdateClubBody,
  DeleteClubParams,
  GetClubMembersParams,
  AddClubMemberParams,
  AddClubMemberBody,
  RemoveClubMemberParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getUserId(req: any): string | null {
  return (req.headers["x-user-id"] as string) || null;
}

async function getPlayerByUserId(userId: string) {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, userId));
  return player || null;
}

async function enrichClub(club: any) {
  const [captain] = await db.select({ gamertag: playersTable.gamertag }).from(playersTable).where(eq(playersTable.id, club.captainId));
  const [memberCount] = await db.select({ count: sql<number>`count(*)::int` }).from(membersTable).where(eq(membersTable.clubId, club.id));

  return {
    ...club,
    captainGamertag: captain?.gamertag ?? null,
    memberCount: memberCount?.count ?? 0,
    createdAt: club.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.get("/clubs", async (req, res): Promise<void> => {
  const params = ListClubsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { platform, style, division, openPosition, country, search, limit = 20, offset = 0 } = params.data;

  const conditions: any[] = [];
  if (platform) conditions.push(eq(clubsTable.platform, platform));
  if (style) conditions.push(eq(clubsTable.style, style));
  if (division !== undefined) conditions.push(eq(clubsTable.division, Number(division)));
  if (country) conditions.push(eq(clubsTable.country, country));
  if (search) conditions.push(like(clubsTable.name, `%${search}%`));
  if (openPosition) conditions.push(like(clubsTable.openPositions, `%${openPosition}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [clubs, countResult] = await Promise.all([
    db.select().from(clubsTable).where(where).orderBy(desc(clubsTable.division)).limit(Number(limit)).offset(Number(offset)),
    db.select({ count: sql<number>`count(*)::int` }).from(clubsTable).where(where),
  ]);

  const enriched = await Promise.all(clubs.map(enrichClub));
  res.json({ clubs: enriched, total: countResult[0]?.count ?? 0 });
});

router.post("/clubs", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "X-User-Id header required" });
    return;
  }

  const player = await getPlayerByUserId(userId);
  if (!player) {
    res.status(400).json({ error: "Create a player profile first" });
    return;
  }

  const parsed = CreateClubBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [club] = await db.insert(clubsTable).values({ ...parsed.data, captainId: player.id }).returning();

  // Add captain as member
  await db.insert(membersTable).values({ clubId: club.id, playerId: player.id, role: "captain" });
  // Update player to not be free agent
  await db.update(playersTable).set({ freeAgent: false, clubId: club.id }).where(eq(playersTable.id, player.id));

  const enriched = await enrichClub(club);
  res.status(201).json(enriched);
});

router.get("/clubs/featured", async (req, res): Promise<void> => {
  const clubs = await db.select().from(clubsTable)
    .where(sql`${clubsTable.openPositions} IS NOT NULL AND ${clubsTable.openPositions} != '[]'`)
    .orderBy(desc(clubsTable.wins))
    .limit(8);

  const enriched = await Promise.all(clubs.map(enrichClub));
  res.json({ clubs: enriched, total: enriched.length });
});

router.get("/clubs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetClubParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, params.data.id));
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }

  const enriched = await enrichClub(club);
  res.json(enriched);
});

router.patch("/clubs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateClubParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = getUserId(req);
  const player = userId ? await getPlayerByUserId(userId) : null;
  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, params.data.id));

  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  if (!player || club.captainId !== player.id) {
    res.status(403).json({ error: "Only the captain can edit the club" });
    return;
  }

  const parsed = UpdateClubBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(clubsTable).set(parsed.data).where(eq(clubsTable.id, params.data.id)).returning();
  const enriched = await enrichClub(updated);
  res.json(enriched);
});

router.delete("/clubs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteClubParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = getUserId(req);
  const player = userId ? await getPlayerByUserId(userId) : null;
  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, params.data.id));

  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  if (!player || club.captainId !== player.id) {
    res.status(403).json({ error: "Only the captain can delete the club" });
    return;
  }

  await db.delete(membersTable).where(eq(membersTable.clubId, params.data.id));
  await db.delete(clubsTable).where(eq(clubsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/clubs/:id/members", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetClubMembersParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const members = await db.select().from(membersTable).where(eq(membersTable.clubId, params.data.id));

  const enriched = await Promise.all(members.map(async (m) => {
    const [player] = await db.select({ gamertag: playersTable.gamertag, mainPosition: playersTable.mainPosition, overallRating: playersTable.overallRating })
      .from(playersTable).where(eq(playersTable.id, m.playerId));
    return {
      ...m,
      playerGamertag: player?.gamertag ?? null,
      playerPosition: player?.mainPosition ?? null,
      playerRating: player?.overallRating ?? null,
      joinedAt: m.joinedAt?.toISOString() ?? new Date().toISOString(),
    };
  }));

  res.json({ members: enriched });
});

router.post("/clubs/:id/members", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddClubMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = AddClubMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.insert(membersTable).values({
    clubId: params.data.id,
    playerId: parsed.data.playerId,
    role: parsed.data.role ?? "player",
  }).returning();

  await db.update(playersTable).set({ freeAgent: false, clubId: params.data.id }).where(eq(playersTable.id, parsed.data.playerId));

  const [player] = await db.select({ gamertag: playersTable.gamertag, mainPosition: playersTable.mainPosition, overallRating: playersTable.overallRating })
    .from(playersTable).where(eq(playersTable.id, member.playerId));

  res.status(201).json({
    ...member,
    playerGamertag: player?.gamertag ?? null,
    playerPosition: player?.mainPosition ?? null,
    playerRating: player?.overallRating ?? null,
    joinedAt: member.joinedAt?.toISOString() ?? new Date().toISOString(),
  });
});

router.delete("/clubs/:id/members/:playerId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawPlayerId = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = RemoveClubMemberParams.safeParse({ id: parseInt(rawId, 10), playerId: parseInt(rawPlayerId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  await db.delete(membersTable).where(and(eq(membersTable.clubId, params.data.id), eq(membersTable.playerId, params.data.playerId)));
  await db.update(playersTable).set({ freeAgent: true, clubId: null }).where(eq(playersTable.id, params.data.playerId));
  res.sendStatus(204);
});

export default router;
