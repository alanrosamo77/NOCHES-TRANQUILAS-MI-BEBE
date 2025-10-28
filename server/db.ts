import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  babies, 
  Baby, 
  InsertBaby,
  sleepEvents,
  SleepEvent,
  InsertSleepEvent,
  dailySummaries,
  DailySummary,
  InsertDailySummary,
  adminNotifications,
  InsertAdminNotification,
  userCredentials,
  UserCredential,
  InsertUserCredential
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Baby management functions
export async function createBaby(baby: InsertBaby): Promise<Baby> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(babies).values(baby);
  const result = await db.select().from(babies).where(eq(babies.id, baby.id)).limit(1);
  
  if (result.length === 0) throw new Error("Failed to create baby");
  return result[0];
}

export async function getBabyByUserId(userId: string): Promise<Baby | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(babies).where(eq(babies.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBabyById(babyId: string): Promise<Baby | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(babies).where(eq(babies.id, babyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBaby(babyId: string, updates: Partial<InsertBaby>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(babies).set(updates).where(eq(babies.id, babyId));
}

export async function getAllBabies(): Promise<Baby[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(babies).orderBy(desc(babies.createdAt));
}

// Sleep event functions
export async function createSleepEvent(event: InsertSleepEvent): Promise<SleepEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(sleepEvents).values(event);
  const result = await db.select().from(sleepEvents).where(eq(sleepEvents.id, event.id)).limit(1);
  
  if (result.length === 0) throw new Error("Failed to create sleep event");
  return result[0];
}

export async function getEventsByBabyId(babyId: string): Promise<SleepEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sleepEvents)
    .where(eq(sleepEvents.babyId, babyId))
    .orderBy(desc(sleepEvents.eventTime));
}

export async function getEventsByBabyAndDay(babyId: string, dayNumber: number): Promise<SleepEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sleepEvents)
    .where(and(eq(sleepEvents.babyId, babyId), eq(sleepEvents.dayNumber, dayNumber)))
    .orderBy(desc(sleepEvents.eventTime));
}

export async function getTodayEvents(babyId: string): Promise<SleepEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await db
    .select()
    .from(sleepEvents)
    .where(
      and(
        eq(sleepEvents.babyId, babyId),
        gte(sleepEvents.eventTime, today),
        lte(sleepEvents.eventTime, tomorrow)
      )
    )
    .orderBy(sleepEvents.eventTime);
}

// Daily summary functions
export async function createDailySummary(summary: InsertDailySummary): Promise<DailySummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(dailySummaries).values(summary);
  const result = await db.select().from(dailySummaries).where(eq(dailySummaries.id, summary.id)).limit(1);
  
  if (result.length === 0) throw new Error("Failed to create daily summary");
  return result[0];
}

export async function getSummariesByBabyId(babyId: string): Promise<DailySummary[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(dailySummaries)
    .where(eq(dailySummaries.babyId, babyId))
    .orderBy(desc(dailySummaries.summaryDate));
}

// Admin notification functions
export async function createAdminNotification(notification: InsertAdminNotification): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(adminNotifications).values(notification);
}

export async function getUnreadNotifications(): Promise<typeof adminNotifications.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(adminNotifications)
    .where(eq(adminNotifications.isRead, false))
    .orderBy(desc(adminNotifications.createdAt));
}

export async function getAllNotifications(): Promise<typeof adminNotifications.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(adminNotifications)
    .orderBy(desc(adminNotifications.createdAt));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(adminNotifications)
    .set({ isRead: true })
    .where(eq(adminNotifications.id, notificationId));
}


// ===== User Credentials Functions =====

export async function createUserCredential(credential: InsertUserCredential): Promise<UserCredential> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userCredentials).values(credential);
  
  const result = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.id, credential.id))
    .limit(1);

  if (!result || result.length === 0) {
    throw new Error("Failed to create user credential");
  }

  return result[0];
}

export async function getUserCredentialByUsername(username: string): Promise<UserCredential | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.username, username))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserCredentialByUserId(userId: string): Promise<UserCredential | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

