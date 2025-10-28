import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role management for admin/parent users.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Babies table - stores information about each baby
 * Each baby is associated with a parent user account
 */
export const babies = mysqlTable("babies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birthDate"),
  ageMonths: int("ageMonths"),
  weightKg: int("weightKg"), // Peso en gramos (ej: 7500 = 7.5kg)
  heightCm: int("heightCm"), // Talla en centímetros
  photoUrl: varchar("photoUrl", { length: 512 }), // URL de la foto del bebé
  initialRoutine: text("initialRoutine"),
  routineStartTime: varchar("routineStartTime", { length: 10 }),
  firstEventAt: timestamp("firstEventAt"),
  accountStatus: mysqlEnum("accountStatus", ["active", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Baby = typeof babies.$inferSelect;
export type InsertBaby = typeof babies.$inferInsert;

/**
 * Sleep events table - stores all events registered by parents
 * Each event has a type, timestamp, and optional comments
 */
export const sleepEvents = mysqlTable("sleepEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  babyId: varchar("babyId", { length: 64 }).notNull(),
  eventType: mysqlEnum("eventType", [
    "siesta_inicio",
    "siesta_fin",
    "noche_inicio",
    "noche_fin",
    "despertar",
    "alimento",
    "baño",
    "cambio",
    "llanto",
    "juego",
    "comida_nocturna",
    "arrullo",
    "estimulacion",
    "panal",
    "otro"
  ]).notNull(),
  eventTime: timestamp("eventTime").notNull(),
  comments: text("comments"),
  dayNumber: int("dayNumber").notNull(),
  // Campos adicionales para detalles de eventos
  wakeReason: varchar("wakeReason", { length: 100 }), // Motivo del despertar
  foodType: varchar("foodType", { length: 100 }), // Tipo de alimento
  foodAmount: varchar("foodAmount", { length: 50 }), // Cantidad de alimento
  duration: int("duration"), // Duración en minutos
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SleepEvent = typeof sleepEvents.$inferSelect;
export type InsertSleepEvent = typeof sleepEvents.$inferInsert;

/**
 * Daily summaries table - stores generated summaries for each day
 * Generated when parent clicks "Rutina Finalizada"
 */
export const dailySummaries = mysqlTable("dailySummaries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  babyId: varchar("babyId", { length: 64 }).notNull(),
  dayNumber: int("dayNumber").notNull(),
  summaryDate: datetime("summaryDate").notNull(),
  totalNaps: int("totalNaps").default(0),
  totalNapDuration: int("totalNapDuration").default(0), // in minutes
  longestNightSleep: int("longestNightSleep").default(0), // in minutes
  nightWakeups: int("nightWakeups").default(0),
  finalWakeupTime: varchar("finalWakeupTime", { length: 10 }), // e.g., "07:30"
  parentObservations: text("parentObservations"),
  detailedSummary: text("detailedSummary"), // JSON string with detailed data
  simpleSummary: text("simpleSummary"), // Human-readable simple summary
  createdAt: timestamp("createdAt").defaultNow(),
});

export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertDailySummary = typeof dailySummaries.$inferInsert;

/**
 * Admin notifications table - stores notifications sent to admin
 * When a routine is finalized, admin receives a notification
 */
export const adminNotifications = mysqlTable("adminNotifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  babyId: varchar("babyId", { length: 64 }).notNull(),
  babyName: varchar("babyName", { length: 255 }).notNull(),
  notificationType: mysqlEnum("notificationType", ["routine_finalized", "account_created"]).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

/**
 * User credentials table - stores simple auth credentials
 * Used for testing and simple authentication
 */
export const userCredentials = mysqlTable("userCredentials", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // In production, this should be hashed
  createdAt: timestamp("createdAt").defaultNow(),
});

export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertUserCredential = typeof userCredentials.$inferInsert;

