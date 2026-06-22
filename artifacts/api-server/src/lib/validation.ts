import { z } from "zod";

// Blacklist of offensive words and patterns
const OFFENSIVE_WORDS = [
  "spam", "scam", "hack", "cheat", "bot", "fake", "phishing",
  // Add more as needed
];

const PROFANITY_FILTER: string[] = [
  // Add profanity words as needed
];

// HTML sanitization - basic XSS prevention
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Check for offensive content
export function containsOffensiveContent(input: string): boolean {
  const lowerInput = input.toLowerCase();
  return OFFENSIVE_WORDS.some(word => lowerInput.includes(word));
}

// Check for profanity
export function containsProfanity(input: string): boolean {
  const lowerInput = input.toLowerCase();
  return PROFANITY_FILTER.some(word => lowerInput.includes(word));
}

// Validate gamertag format
export const gamertagSchema = z.string()
  .min(3, "Gamertag must be at least 3 characters")
  .max(20, "Gamertag must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_\-]+$/, "Gamertag can only contain letters, numbers, underscores, and hyphens")
  .transform(sanitizeHtml);

// Validate display name
export const displayNameSchema = z.string()
  .max(50, "Display name must be at most 50 characters")
  .optional()
  .nullable()
  .transform((val: string | null | undefined) => val ? sanitizeHtml(val) : val);

// Validate bio/description
export const bioSchema = z.string()
  .max(500, "Bio must be at most 500 characters")
  .optional()
  .nullable()
  .transform((val: string | null | undefined) => {
    if (!val) return val;
    const sanitized = sanitizeHtml(val);
    if (containsOffensiveContent(sanitized)) {
      throw new Error("Bio contains offensive content");
    }
    if (containsProfanity(sanitized)) {
      throw new Error("Bio contains inappropriate language");
    }
    return sanitized;
  });

// Validate platform
export const platformSchema = z.enum(["PS5", "Xbox", "PC"], {
  errorMap: () => ({ message: "Platform must be PS5, Xbox, or PC" })
});

// Validate position
export const positionSchema = z.enum(["GK", "RB", "CB", "LB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "ST"], {
  errorMap: () => ({ message: "Invalid position" })
});

// Validate overall rating (1-99)
export const overallRatingSchema = z.number()
  .min(1, "Overall rating must be at least 1")
  .max(99, "Overall rating must be at most 99");

// Validate stats (non-negative, reasonable max)
export const statsSchema = z.number()
  .min(0, "Stats cannot be negative")
  .max(1000, "Stats value seems too high");

// Validate pass accuracy (0-100)
export const passAccuracySchema = z.number()
  .min(0, "Pass accuracy must be at least 0")
  .max(100, "Pass accuracy must be at most 100");

// Validate country code (ISO 3166-1 alpha-2)
export const countryCodeSchema = z.string()
  .length(2, "Country code must be 2 characters")
  .regex(/^[A-Z]{2}$/, "Invalid country code format");

// Validate timezone
export const timezoneSchema = z.string()
  .regex(/^[A-Za-z\/]+$/, "Invalid timezone format");

// Validate club name
export const clubNameSchema = z.string()
  .min(3, "Club name must be at least 3 characters")
  .max(50, "Club name must be at most 50 characters")
  .transform(sanitizeHtml);

// Validate club description
export const clubDescriptionSchema = z.string()
  .max(1000, "Club description must be at most 1000 characters")
  .optional()
  .nullable()
  .transform((val: string | null | undefined) => {
    if (!val) return val;
    const sanitized = sanitizeHtml(val);
    if (containsOffensiveContent(sanitized)) {
      throw new Error("Description contains offensive content");
    }
    if (containsProfanity(sanitized)) {
      throw new Error("Description contains inappropriate language");
    }
    return sanitized;
  });

// Validate division (1-10)
export const divisionSchema = z.number()
  .min(1, "Division must be at least 1")
  .max(10, "Division must be at most 10");

// Validate style
export const styleSchema = z.enum(["competitive", "casual", "semi-competitive"], {
  errorMap: () => ({ message: "Style must be competitive, casual, or semi-competitive" })
});

// Validate JSON fields (playDays, openPositions)
export const jsonArraySchema = z.string()
  .transform((val: string) => {
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        throw new Error("Must be a JSON array");
      }
      if (parsed.length > 10) {
        throw new Error("Array must have at most 10 items");
      }
      return val;
    } catch {
      throw new Error("Invalid JSON array format");
    }
  });

// Validate time format (HH:MM)
export const timeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format");

// Validate URL (optional, for badge/avatar)
export const urlSchema = z.string()
  .url("Invalid URL format")
  .optional()
  .nullable()
  .refine(val => {
    if (!val) return true;
    try {
      const url = new URL(val);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  }, "URL must use HTTP or HTTPS protocol");

// Combined validation for player creation/update
export const validatePlayerInput = (data: any) => {
  const schema = z.object({
    gamertag: gamertagSchema,
    displayName: displayNameSchema,
    platform: platformSchema,
    mainPosition: positionSchema,
    secondaryPosition: positionSchema.optional().nullable(),
    overallRating: overallRatingSchema,
    goals: statsSchema.optional().nullable(),
    assists: statsSchema.optional().nullable(),
    passAccuracy: passAccuracySchema.optional().nullable(),
    cleanSheets: statsSchema.optional().nullable(),
    matchesPlayed: statsSchema.optional().nullable(),
    country: countryCodeSchema,
    timezone: timezoneSchema,
    availableDays: jsonArraySchema.optional().nullable(),
    availableFrom: timeSchema.optional().nullable(),
    availableTo: timeSchema.optional().nullable(),
    bio: bioSchema,
    avatarUrl: urlSchema,
  }).superRefine((val, ctx) => {
    // Algoritmo de control de fraude (Anti-Mentiras)
    if (val.matchesPlayed != null && val.matchesPlayed > 0) {
      const matches = val.matchesPlayed;
      
      // Límite realista de goles por partido
      if (val.goals != null && val.goals > matches * 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fraude detectado: Los goles declarados son estadísticamente imposibles para los partidos jugados.",
          path: ["goals"]
        });
      }
      
      // Límite realista de asistencias por partido
      if (val.assists != null && val.assists > matches * 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fraude detectado: Las asistencias declaradas son estadísticamente imposibles para los partidos jugados.",
          path: ["assists"]
        });
      }
      
      // Imposible tener más porterías a cero que partidos
      if (val.cleanSheets != null && val.cleanSheets > matches) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fraude detectado: Las porterías imbatidas no pueden ser mayores a los partidos jugados.",
          path: ["cleanSheets"]
        });
      }
    } else if (val.matchesPlayed === 0 || val.matchesPlayed == null) {
      // Si no ha jugado partidos, no puede tener stats
      if (val.goals != null && val.goals > 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "No puedes tener goles si no has jugado partidos.", path: ["goals"] });
      }
      if (val.assists != null && val.assists > 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "No puedes tener asistencias si no has jugado partidos.", path: ["assists"] });
      }
      if (val.cleanSheets != null && val.cleanSheets > 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "No puedes tener porterías a cero si no has jugado partidos.", path: ["cleanSheets"] });
      }
    }
    
    // Validación de GRL basado en partidos jugados (Simulando nivel real de EA)
    const matches = val.matchesPlayed || 0;
    if (val.overallRating > 84 && matches < 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fraude detectado: Es imposible tener más de 84 de GRL con menos de 30 partidos jugados en Clubes Pro.",
        path: ["overallRating"]
      });
    }
    if (val.overallRating > 88 && matches < 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fraude detectado: Es imposible tener más de 88 de GRL con menos de 100 partidos jugados en Clubes Pro.",
        path: ["overallRating"]
      });
    }
    if (val.overallRating > 92 && matches < 250) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fraude detectado: Es imposible tener más de 92 de GRL con menos de 250 partidos jugados en Clubes Pro.",
        path: ["overallRating"]
      });
    }
  });

  return schema.safeParse(data);
};

// Combined validation for club creation/update
export const validateClubInput = (data: any) => {
  const schema = z.object({
    name: clubNameSchema,
    platform: platformSchema,
    division: divisionSchema,
    style: styleSchema,
    country: countryCodeSchema,
    timezone: timezoneSchema,
    playDays: jsonArraySchema,
    playFrom: timeSchema,
    playTo: timeSchema,
    openPositions: jsonArraySchema,
    description: clubDescriptionSchema,
    badgeUrl: urlSchema,
  });

  return schema.safeParse(data);
};
