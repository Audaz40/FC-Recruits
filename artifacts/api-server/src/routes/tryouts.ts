import { Router, type IRouter } from "express";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { db, tryoutsTable, clubsTable, playersTable, ratingsTable, notificationsTable } from "@workspace/db";
import {
  ListTryoutsQueryParams,
  CreateTryoutBody,
  GetTryoutParams,
  UpdateTryoutParams,
  UpdateTryoutBody,
  RateTryoutParams,
  RateTryoutBody,
} from "@workspace/api-zod";
import { strictRateLimit } from "../middlewares/rateLimit";
import { requireTrustScore, adjustTrustScore, adjustClubTrustScore } from "../middlewares/trustScore";

const router: IRouter = Router();

function getUserId(req: any): string | null {
  return (req.headers["x-user-id"] as string) || null;
}

async function getPlayerByUserId(userId: string) {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, userId));
  return player || null;
}

async function enrichTryout(t: any) {
  const [club] = await db.select({ name: clubsTable.name, logoUrl: clubsTable.logoUrl }).from(clubsTable).where(eq(clubsTable.id, t.clubId));
  const [player] = await db.select({ gamertag: playersTable.gamertag, mainPosition: playersTable.mainPosition, overallRating: playersTable.overallRating })
    .from(playersTable).where(eq(playersTable.id, t.playerId));

  return {
    ...t,
    clubName: club?.name ?? null,
    clubLogoUrl: club?.logoUrl ?? null,
    playerGamertag: player?.gamertag ?? null,
    playerPosition: player?.mainPosition ?? null,
    playerRating: player?.overallRating ?? null,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: t.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.get("/tryouts", async (req, res): Promise<void> => {
  const params = ListTryoutsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { status, playerId, clubId } = params.data;
  const conditions: any[] = [];
  if (status) conditions.push(eq(tryoutsTable.status, status));
  if (playerId !== undefined) conditions.push(eq(tryoutsTable.playerId, Number(playerId)));
  if (clubId !== undefined) conditions.push(eq(tryoutsTable.clubId, Number(clubId)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const tryouts = await db.select().from(tryoutsTable).where(where).orderBy(desc(tryoutsTable.createdAt));
  const enriched = await Promise.all(tryouts.map(enrichTryout));

  res.json({ tryouts: enriched, total: enriched.length });
});

router.post("/tryouts", strictRateLimit, requireTrustScore("createTryout"), async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "X-User-Id header required" });
    return;
  }

  const parsed = CreateTryoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tryout] = await db.insert(tryoutsTable).values(parsed.data).returning();

  // Create notifications
  if (parsed.data.initiatedBy === "player") {
    // Notify the club captain
    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, parsed.data.clubId));
    const [captain] = club ? await db.select().from(playersTable).where(eq(playersTable.id, club.captainId)) : [];
    if (captain) {
      await db.insert(notificationsTable).values({
        userId: captain.userId,
        type: "tryout_request",
        message: `A player has requested a tryout at your club`,
        relatedId: tryout.id,
      });
    }
  } else {
    // Notify the player
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, parsed.data.playerId));
    if (player) {
      const [club] = await db.select({ name: clubsTable.name }).from(clubsTable).where(eq(clubsTable.id, parsed.data.clubId));
      await db.insert(notificationsTable).values({
        userId: player.userId,
        type: "club_invite",
        message: `${club?.name ?? "A club"} has invited you to a tryout`,
        relatedId: tryout.id,
      });
    }
  }

  const enriched = await enrichTryout(tryout);
  res.status(201).json(enriched);
});

router.get("/tryouts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTryoutParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [tryout] = await db.select().from(tryoutsTable).where(eq(tryoutsTable.id, params.data.id));
  if (!tryout) {
    res.status(404).json({ error: "Tryout not found" });
    return;
  }

  const enriched = await enrichTryout(tryout);
  res.json(enriched);
});

router.patch("/tryouts/:id", strictRateLimit, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTryoutParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateTryoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(tryoutsTable).where(eq(tryoutsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Tryout not found" });
    return;
  }

  const [tryout] = await db.update(tryoutsTable).set(parsed.data).where(eq(tryoutsTable.id, params.data.id)).returning();

  // Create status change notification
  if (parsed.data.status) {
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, existing.playerId));
    if (player && parsed.data.status === "accepted") {
      await db.insert(notificationsTable).values({
        userId: player.userId,
        type: "tryout_accepted",
        message: "Your tryout request has been accepted",
        relatedId: tryout.id,
      });
    } else if (player && parsed.data.status === "rejected") {
      await db.insert(notificationsTable).values({
        userId: player.userId,
        type: "tryout_rejected",
        message: "Your tryout request was not accepted",
        relatedId: tryout.id,
      });
    } else if (player && parsed.data.status === "scheduled") {
      await db.insert(notificationsTable).values({
        userId: player.userId,
        type: "tryout_scheduled",
        message: `Your tryout has been scheduled`,
        relatedId: tryout.id,
      });
    }
  }

  const enriched = await enrichTryout(tryout);
  res.json(enriched);
});

router.post("/tryouts/:id/rate", strictRateLimit, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RateTryoutParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = RateTryoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tryout] = await db.select().from(tryoutsTable).where(eq(tryoutsTable.id, params.data.id));
  if (!tryout) {
    res.status(404).json({ error: "Tryout not found" });
    return;
  }

  const [rating] = await db.insert(ratingsTable).values({
    tryoutId: params.data.id,
    ratedBy: parsed.data.ratedBy,
    score: parsed.data.score,
    comment: parsed.data.comment,
  }).returning();

  // Update the tryout with the rating score
  if (parsed.data.ratedBy === "player") {
    await db.update(tryoutsTable).set({ playerRatingScore: parsed.data.score, status: "completed" }).where(eq(tryoutsTable.id, params.data.id));
    
    // Adjust club trust score based on player's rating
    const scoreDiff = parsed.data.score >= 4 ? 2 : (parsed.data.score <= 2 ? -2 : 0);
    if (scoreDiff !== 0) {
      await adjustClubTrustScore(tryout.clubId, scoreDiff, `Rated ${parsed.data.score}/5 by player in tryout`);
    }
  } else {
    await db.update(tryoutsTable).set({ clubRatingScore: parsed.data.score, status: "completed" }).where(eq(tryoutsTable.id, params.data.id));
    // Notify player of their rating
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, tryout.playerId));
    if (player) {
      await db.insert(notificationsTable).values({
        userId: player.userId,
        type: "tryout_rated",
        message: `You received a ${parsed.data.score}/5 rating from your tryout`,
        relatedId: tryout.id,
      });

      // Adjust player trust score based on club's rating
      const scoreDiff = parsed.data.score >= 4 ? 2 : (parsed.data.score <= 2 ? -2 : 0);
      if (scoreDiff !== 0) {
        await adjustTrustScore(player.userId, scoreDiff, `Rated ${parsed.data.score}/5 by club in tryout`);
      }
    }
  }

  res.status(201).json({
    ...rating,
    createdAt: rating.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

export default router;
