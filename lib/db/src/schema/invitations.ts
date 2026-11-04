import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invitationsTable = pgTable("mizan_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().unique().defaultRandom(),
  ownerHash: text("owner_hash").notNull().unique(),
  token: uuid("token").notNull().unique().defaultRandom(),
  template: text("template").notNull(),
  coupleNames: text("couple_names").notNull(),
  eventName: text("event_name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  location: text("location").notNull(),
  message: text("message").notNull(),
  language: text("language").notNull(),
  allowPlusOnes: boolean("allow_plus_ones").notNull().default(false),
  maxParty: integer("max_party").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertInvitationSchema = createInsertSchema(invitationsTable).omit({ id: true, eventId: true, token: true, updatedAt: true });
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
