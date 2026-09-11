import { UIMessage as Message } from "ai";
import { InferSelectModel } from "drizzle-orm";

import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export const reservation = pgTable("Reservation", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  details: json("details").notNull(),
  hasCompletedPayment: boolean("hasCompletedPayment").notNull().default(false),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Reservation = InferSelectModel<typeof reservation>;

/**
 * جدول مفاتيح الـ API الخاصة بالطلاب (user_api_keys)
 * سيتم ربطه مع Supabase لاحقًا وتشفير المفاتيح قبل الحفظ
 */
export const userApiKeys = pgTable("user_api_keys", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  studentId: varchar("student_id", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(), // gemini, openrouter, github
  keyName: varchar("key_name", { length: 128 }).notNull(),
  encryptedApiKey: varchar("encrypted_api_key", { length: 512 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserApiKeyRecord = InferSelectModel<typeof userApiKeys>;

