import { pgTable, uuid, text, integer, uniqueIndex, index, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { invitationsTable } from "./invitations";

export const weddingGuestsTable = pgTable("mizan_wedding_guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => invitationsTable.eventId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull(),
  attendees: integer("attendees").notNull(),
  notes: text("notes").notNull().default(""),
  source: text("source").notNull().default("manual"),
  responseKey: uuid("response_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("mizan_event_response_key").on(table.eventId, table.responseKey),
  index("mizan_guest_event").on(table.eventId),
]);
export const insertWeddingGuestSchema = createInsertSchema(weddingGuestsTable).omit({ id: true, updatedAt: true });
export type InsertWeddingGuest = z.infer<typeof insertWeddingGuestSchema>;
