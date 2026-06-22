import { db } from "./src/index";
import { eq } from "drizzle-orm";
import {
  playersTable,
  clubsTable,
  membersTable,
  tryoutsTable,
  ratingsTable,
  notificationsTable,
} from "./src/schema";

async function seed() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await db.delete(notificationsTable);
  await db.delete(ratingsTable);
  await db.delete(tryoutsTable);
  await db.delete(membersTable);
  await db.delete(playersTable);
  await db.delete(clubsTable);

  console.log("🗑️  Cleared existing data");

  // Insert clubs
  const clubs = await db
    .insert(clubsTable)
    .values([
      {
        captainId: 1, // Will be updated after players are inserted
        name: "Elite FC United",
        trustScore: 75,
        platform: "PS5",
        division: 1,
        style: "competitive",
        country: "Spain",
        timezone: "Europe/Madrid",
        playDays: JSON.stringify(["Monday", "Wednesday", "Friday"]),
        playFrom: "20:00",
        playTo: "23:00",
        openPositions: JSON.stringify(["ST", "CAM", "CB"]),
        description: "Top-tier competitive club looking for skilled players to compete in Division 1.",
        badgeUrl: null,
        createdAt: new Date(),
      },
      {
        captainId: 2, // Will be updated after players are inserted
        name: "Sunday League Heroes",
        trustScore: 60,
        platform: "Xbox",
        division: 5,
        style: "casual",
        country: "United Kingdom",
        timezone: "Europe/London",
        playDays: JSON.stringify(["Sunday", "Saturday"]),
        playFrom: "18:00",
        playTo: "21:00",
        openPositions: JSON.stringify(["GK", "LB", "RB", "CDM", "ST"]),
        description: "Casual club for players who want to have fun and improve together.",
        badgeUrl: null,
        createdAt: new Date(),
      },
    ])
    .returning();

  console.log(`✅ Inserted ${clubs.length} clubs`);

  // Insert players
  const players = await db
    .insert(playersTable)
    .values([
      {
        userId: "user_1",
        gamertag: "SpeedDemon99",
        displayName: "Marco Rossi",
        platform: "PS5",
        mainPosition: "ST",
        secondaryPosition: "CAM",
        overallRating: 88,
        goals: 245,
        assists: 89,
        passAccuracy: 87.5,
        cleanSheets: 0,
        matchesPlayed: 156,
        country: "Italy",
        timezone: "Europe/Rome",
        availableDays: JSON.stringify(["Monday", "Wednesday", "Friday", "Sunday"]),
        availableFrom: "19:00",
        availableTo: "23:00",
        bio: "Explosive striker with great finishing and pace. Looking for a competitive Div 1-2 club.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
      {
        userId: "user_2",
        gamertag: "WallKeeper_Pro",
        displayName: "Carlos Santos",
        platform: "PS5",
        mainPosition: "GK",
        secondaryPosition: null,
        overallRating: 85,
        goals: 0,
        assists: 12,
        passAccuracy: 92.3,
        cleanSheets: 45,
        matchesPlayed: 120,
        country: "Portugal",
        timezone: "Europe/Lisbon",
        availableDays: JSON.stringify(["Tuesday", "Thursday", "Saturday"]),
        availableFrom: "20:00",
        availableTo: "22:30",
        bio: "Reliable goalkeeper with great reflexes. Team player who communicates well.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
      {
        userId: "user_3",
        gamertag: "PlayMaker_X",
        displayName: "Lukas Mueller",
        platform: "Xbox",
        mainPosition: "CAM",
        secondaryPosition: "CM",
        overallRating: 86,
        goals: 78,
        assists: 156,
        passAccuracy: 91.8,
        cleanSheets: 0,
        matchesPlayed: 145,
        country: "Germany",
        timezone: "Europe/Berlin",
        availableDays: JSON.stringify(["Monday", "Wednesday", "Friday"]),
        availableFrom: "18:00",
        availableTo: "22:00",
        bio: "Creative playmaker with excellent vision and passing. Looking for a tactical team.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
      {
        userId: "user_4",
        gamertag: "RockSolid_CB",
        displayName: "James Wilson",
        platform: "PS5",
        mainPosition: "CB",
        secondaryPosition: "CDM",
        overallRating: 84,
        goals: 15,
        assists: 8,
        passAccuracy: 88.2,
        cleanSheets: 38,
        matchesPlayed: 132,
        country: "England",
        timezone: "Europe/London",
        availableDays: JSON.stringify(["Tuesday", "Thursday", "Saturday", "Sunday"]),
        availableFrom: "19:30",
        availableTo: "23:00",
        bio: "Strong defender with good positioning. Vocal leader on the pitch.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
      {
        userId: "user_5",
        gamertag: "WingWizard23",
        displayName: "Pierre Dubois",
        platform: "Xbox",
        mainPosition: "LW",
        secondaryPosition: "RW",
        overallRating: 83,
        goals: 134,
        assists: 67,
        passAccuracy: 85.6,
        cleanSheets: 0,
        matchesPlayed: 118,
        country: "France",
        timezone: "Europe/Paris",
        availableDays: JSON.stringify(["Monday", "Wednesday", "Friday"]),
        availableFrom: "20:00",
        availableTo: "23:00",
        bio: "Fast winger with great dribbling skills. Always looking to attack.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
      {
        userId: "user_6",
        gamertag: "MidfieldEngine",
        displayName: "Erik Johansson",
        platform: "PS5",
        mainPosition: "CM",
        secondaryPosition: "CDM",
        overallRating: 85,
        goals: 45,
        assists: 98,
        passAccuracy: 90.1,
        cleanSheets: 0,
        matchesPlayed: 140,
        country: "Sweden",
        timezone: "Europe/Stockholm",
        availableDays: JSON.stringify(["Tuesday", "Thursday", "Saturday"]),
        availableFrom: "19:00",
        availableTo: "22:00",
        bio: "Box-to-box midfielder with great stamina and work rate.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
      {
        userId: "user_7",
        gamertag: "TargetMan_9",
        displayName: "Diego Fernandez",
        platform: "Xbox",
        mainPosition: "ST",
        secondaryPosition: "CF",
        overallRating: 87,
        goals: 189,
        assists: 45,
        passAccuracy: 82.4,
        cleanSheets: 0,
        matchesPlayed: 138,
        country: "Argentina",
        timezone: "America/Argentina/Buenos_Aires",
        availableDays: JSON.stringify(["Monday", "Wednesday", "Friday", "Sunday"]),
        availableFrom: "21:00",
        availableTo: "00:00",
        bio: "Physical striker with great heading and hold-up play.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
      {
        userId: "user_8",
        gamertag: "FullBackExpress",
        displayName: "Tomáš Novák",
        platform: "PS5",
        mainPosition: "RB",
        secondaryPosition: "LB",
        overallRating: 82,
        goals: 28,
        assists: 72,
        passAccuracy: 86.8,
        cleanSheets: 22,
        matchesPlayed: 125,
        country: "Czech Republic",
        timezone: "Europe/Prague",
        availableDays: JSON.stringify(["Tuesday", "Thursday", "Saturday"]),
        availableFrom: "19:00",
        availableTo: "22:30",
        bio: "Attacking fullback who loves to overlap and deliver crosses.",
        freeAgent: true,
        clubId: null,
        avatarUrl: null,
        createdAt: new Date(),
      },
    ])
    .returning();

  console.log(`✅ Inserted ${players.length} players`);

  // Add some players to clubs
  await db.insert(membersTable).values([
    { clubId: clubs[0].id, playerId: players[0].id, role: "starter", joinedAt: new Date() },
    { clubId: clubs[0].id, playerId: players[3].id, role: "starter", joinedAt: new Date() },
    { clubId: clubs[1].id, playerId: players[4].id, role: "starter", joinedAt: new Date() },
    { clubId: clubs[1].id, playerId: players[7].id, role: "substitute", joinedAt: new Date() },
  ]);

  console.log("✅ Inserted club memberships");

  // Update players with clubId
  await db
    .update(playersTable)
    .set({ clubId: clubs[0].id, freeAgent: false })
    .where(eq(playersTable.id, players[0].id));
  await db
    .update(playersTable)
    .set({ clubId: clubs[0].id, freeAgent: false })
    .where(eq(playersTable.id, players[3].id));
  await db
    .update(playersTable)
    .set({ clubId: clubs[1].id, freeAgent: false })
    .where(eq(playersTable.id, players[4].id));
  await db
    .update(playersTable)
    .set({ clubId: clubs[1].id, freeAgent: false })
    .where(eq(playersTable.id, players[7].id));

  console.log("✅ Updated player club affiliations");

  // Insert tryouts
  const tryouts = await db
    .insert(tryoutsTable)
    .values([
      {
        playerId: players[1].id,
        clubId: clubs[0].id,
        status: "pending",
        requestedBy: "player",
        scheduledAt: null,
        createdAt: new Date(),
      },
      {
        playerId: players[2].id,
        clubId: clubs[1].id,
        status: "accepted",
        requestedBy: "club",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        createdAt: new Date(),
      },
    ])
    .returning();

  console.log(`✅ Inserted ${tryouts.length} tryouts`);

  // Insert ratings for completed tryouts (simulated)
  await db.insert(ratingsTable).values([
    {
      tryoutId: tryouts[1].id,
      ratedBy: "club",
      score: 4,
      comment: "Great vision and passing, needs to work on defensive positioning",
      createdAt: new Date(),
    },
  ]);

  console.log("✅ Inserted ratings");

  // Insert notifications
  await db.insert(notificationsTable).values([
    {
      userId: players[1].userId,
      type: "tryout_request",
      title: "New tryout request",
      message: "Elite FC United has invited you for a tryout",
      read: false,
      createdAt: new Date(),
    },
    {
      userId: players[2].userId,
      type: "tryout_accepted",
      title: "Tryout accepted",
      message: "Sunday League Heroes accepted your tryout request",
      read: true,
      createdAt: new Date(),
    },
  ]);

  console.log("✅ Inserted notifications");

  console.log("🎉 Seed completed successfully!");
}

seed()
  .then(() => {
    console.log("✅ Seed process finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
