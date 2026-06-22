import { Request, Response, NextFunction } from "express";
import { db, playersTable, clubsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Trust score thresholds
const TRUST_THRESHOLDS = {
  LOW: 30,      // Below this: restricted access
  MEDIUM: 50,   // Below this: limited features
  HIGH: 75,     // Above this: full access + benefits
};

// Actions that require minimum trust scores
const TRUST_REQUIREMENTS = {
  createClub: TRUST_THRESHOLDS.MEDIUM,
  createTryout: TRUST_THRESHOLDS.MEDIUM,
  ratePlayer: TRUST_THRESHOLDS.LOW,
  rateTryout: TRUST_THRESHOLDS.LOW,
  postInChat: TRUST_THRESHOLDS.LOW,
  createTournament: TRUST_THRESHOLDS.HIGH,
};

async function getPlayerTrustScore(userId: string): Promise<number> {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, userId));
  return player?.trustScore ?? TRUST_THRESHOLDS.MEDIUM;
}

async function getClubTrustScore(clubId: number): Promise<number> {
  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, clubId));
  return club?.trustScore ?? TRUST_THRESHOLDS.MEDIUM;
}

// Middleware to check trust score before allowing an action
export function requireTrustScore(action: keyof typeof TRUST_REQUIREMENTS) {
  const requiredScore = TRUST_REQUIREMENTS[action];

  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      res.status(401).json({ error: "X-User-Id header required" });
      return;
    }

    const trustScore = await getPlayerTrustScore(userId);

    if (trustScore < requiredScore) {
      res.status(403).json({
        error: `Insufficient trust score. Required: ${requiredScore}, Current: ${trustScore}`,
        trustScore,
        requiredScore,
      });
      return;
    }

    // Attach trust score to request for use in handlers
    (req as any).trustScore = trustScore;
    next();
  };
}

// Middleware to decrease trust score for bad behavior
export function decreaseTrustScore(amount: number = 5) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      next();
      return;
    }

    // This would be called after a report is confirmed or bad behavior is detected
    // For now, it's a placeholder for manual admin actions
    next();
  };
}

// Middleware to increase trust score for good behavior
export function increaseTrustScore(amount: number = 2) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      next();
      return;
    }

    // This would be called after positive actions (completed tryouts, good ratings, etc.)
    // For now, it's a placeholder for future implementation
    next();
  };
}

// Helper function to manually adjust trust score (for admin use)
export async function adjustTrustScore(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, userId));

  if (!player) {
    throw new Error("Player not found");
  }

  const newScore = Math.max(0, Math.min(100, player.trustScore + amount));

  await db.update(playersTable)
    .set({ trustScore: newScore })
    .where(eq(playersTable.userId, userId));

  console.log(`[Trust Score] Adjusted ${userId} by ${amount} to ${newScore}. Reason: ${reason}`);
}

// Helper function to adjust club trust score
export async function adjustClubTrustScore(
  clubId: number,
  amount: number,
  reason: string
): Promise<void> {
  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, clubId));

  if (!club) {
    throw new Error("Club not found");
  }

  const newScore = Math.max(0, Math.min(100, club.trustScore + amount));

  await db.update(clubsTable)
    .set({ trustScore: newScore })
    .where(eq(clubsTable.id, clubId));

  console.log(`[Trust Score] Adjusted club ${clubId} by ${amount} to ${newScore}. Reason: ${reason}`);
}
