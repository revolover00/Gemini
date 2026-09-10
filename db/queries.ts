import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User, reservation, Reservation } from "./schema";

// In-memory data store for preview and development when Postgres is unavailable
const inMemoryUsers = new Map<string, User>();
const inMemoryChats = new Map<string, any>();
const inMemoryReservations = new Map<string, Reservation>();

// Pre-seed demo user so user can sign in immediately
const demoSalt = genSaltSync(10);
const demoHash = hashSync("password123", demoSalt);
const demoUser: User = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@example.com",
  password: demoHash,
};
inMemoryUsers.set(demoUser.email.toLowerCase(), demoUser);

let dbClient: any = null;

function getDb() {
  if (dbClient !== null) {
    return dbClient;
  }

  const url = process.env.POSTGRES_URL;
  if (!url || url.trim() === "" || url === "undefined") {
    return null;
  }

  try {
    const connectionUrl = url.includes("sslmode=") ? url : `${url}?sslmode=require`;
    const client = postgres(connectionUrl, {
      connect_timeout: 5,
      max: 1,
    });
    dbClient = drizzle(client);
    return dbClient;
  } catch (error) {
    console.warn("⚠️ [AI Studio] Failed to connect to Postgres, fallback to in-memory store:", error);
    return null;
  }
}

function parseMessages(raw: any): any {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

export async function getUser(email: string): Promise<Array<User>> {
  const database = getDb();
  if (database) {
    try {
      return await database.select().from(user).where(eq(user.email, email));
    } catch (error) {
      console.warn("Database query failed for getUser, fallback to memory store:", error);
    }
  }

  const found = inMemoryUsers.get(email.toLowerCase());
  return found ? [found] : [];
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  const newId = crypto.randomUUID();

  const newUserRecord: User = {
    id: newId,
    email: email.toLowerCase(),
    password: hash,
  };

  const database = getDb();
  if (database) {
    try {
      return await database.insert(user).values({ email, password: hash });
    } catch (error) {
      console.warn("Database insert failed for createUser, fallback to memory store:", error);
    }
  }

  inMemoryUsers.set(email.toLowerCase(), newUserRecord);
  return [newUserRecord];
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  const parsed = parseMessages(messages);
  const chatItem = {
    id,
    createdAt: new Date(),
    messages: parsed,
    userId,
  };

  const database = getDb();
  if (database) {
    try {
      const selectedChats = await database.select().from(chat).where(eq(chat.id, id));

      if (selectedChats.length > 0) {
        return await database
          .update(chat)
          .set({
            messages: JSON.stringify(parsed),
          })
          .where(eq(chat.id, id));
      }

      return await database.insert(chat).values({
        id,
        createdAt: new Date(),
        messages: JSON.stringify(parsed),
        userId,
      });
    } catch (error) {
      console.warn("Database saveChat failed, fallback to memory store:", error);
    }
  }

  inMemoryChats.set(id, chatItem);
  return chatItem;
}

export async function deleteChatById({ id }: { id: string }) {
  const database = getDb();
  if (database) {
    try {
      return await database.delete(chat).where(eq(chat.id, id));
    } catch (error) {
      console.warn("Database deleteChatById failed, fallback to memory store:", error);
    }
  }

  inMemoryChats.delete(id);
  return { id };
}

export async function getChatsByUserId({ id }: { id: string }) {
  const database = getDb();
  if (database) {
    try {
      const dbChats = await database
        .select()
        .from(chat)
        .where(eq(chat.userId, id))
        .orderBy(desc(chat.createdAt));
      return dbChats.map((c: any) => ({
        ...c,
        messages: parseMessages(c.messages),
      }));
    } catch (error) {
      console.warn("Database getChatsByUserId failed, fallback to memory store:", error);
    }
  }

  const results: any[] = [];
  for (const item of inMemoryChats.values()) {
    if (item.userId === id) {
      results.push({
        ...item,
        messages: parseMessages(item.messages),
      });
    }
  }
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return results;
}

export async function getChatById({ id }: { id: string }) {
  const database = getDb();
  if (database) {
    try {
      const [selectedChat] = await database.select().from(chat).where(eq(chat.id, id));
      if (selectedChat) {
        return {
          ...selectedChat,
          messages: parseMessages(selectedChat.messages),
        };
      }
    } catch (error) {
      console.warn("Database getChatById failed, fallback to memory store:", error);
    }
  }

  const item = inMemoryChats.get(id);
  if (!item) return undefined;
  return {
    ...item,
    messages: parseMessages(item.messages),
  };
}

export async function createReservation({
  id,
  userId,
  details,
}: {
  id: string;
  userId: string;
  details: any;
}) {
  const newReservation: Reservation = {
    id,
    createdAt: new Date(),
    userId,
    hasCompletedPayment: false,
    details,
  };

  const database = getDb();
  if (database) {
    try {
      return await database.insert(reservation).values({
        id,
        createdAt: new Date(),
        userId,
        hasCompletedPayment: false,
        details: JSON.stringify(details),
      });
    } catch (error) {
      console.warn("Database createReservation failed, fallback to memory store:", error);
    }
  }

  inMemoryReservations.set(id, newReservation);
  return newReservation;
}

export async function getReservationById({ id }: { id: string }) {
  const database = getDb();
  if (database) {
    try {
      const [selectedReservation] = await database
        .select()
        .from(reservation)
        .where(eq(reservation.id, id));
      if (selectedReservation) {
        let details = selectedReservation.details;
        if (typeof details === "string") {
          try {
            details = JSON.parse(details);
          } catch {
            details = {};
          }
        }
        return {
          ...selectedReservation,
          details,
        };
      }
    } catch (error) {
      console.warn("Database getReservationById failed, fallback to memory store:", error);
    }
  }

  return inMemoryReservations.get(id);
}

export async function updateReservation({
  id,
  hasCompletedPayment,
}: {
  id: string;
  hasCompletedPayment: boolean;
}) {
  const database = getDb();
  if (database) {
    try {
      return await database
        .update(reservation)
        .set({
          hasCompletedPayment,
        })
        .where(eq(reservation.id, id));
    } catch (error) {
      console.warn("Database updateReservation failed, fallback to memory store:", error);
    }
  }

  const existing = inMemoryReservations.get(id);
  if (existing) {
    existing.hasCompletedPayment = hasCompletedPayment;
    inMemoryReservations.set(id, existing);
    return existing;
  }
  return null;
}
