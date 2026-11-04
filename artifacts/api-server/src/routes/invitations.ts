import { createHash, randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, asc } from "drizzle-orm";
import { db, invitationsTable, weddingGuestsTable } from "@workspace/db";
import {
  GetMyInvitationResponse, SaveInvitationBody, SaveInvitationResponse,
  ListWeddingGuestsResponse, AddWeddingGuestBody, AddWeddingGuestResponse,
  EditWeddingGuestBody, EditWeddingGuestParams, EditWeddingGuestResponse,
  RemoveWeddingGuestParams, GetPublicInvitationParams, GetPublicInvitationResponse,
  SubmitRsvpBody, SubmitRsvpParams, SubmitRsvpResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const COOKIE = "mizan_demo_owner";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Anonymous demo workspace, not an account or sign-in system. Only the
// unguessable private cookie can edit a wedding; the public token is read/RSVP-only.
function ownerHash(req: Request, res: Response): string {
  const raw = req.headers.cookie?.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const owner = raw && UUID.test(raw) ? raw : randomUUID();
  if (owner !== raw) {
    const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
    res.cookie(COOKIE, owner, { httpOnly: true, secure, sameSite: secure ? "none" : "lax", maxAge: 365 * 86400000, path: "/api/mizan" });
  }
  return createHash("sha256").update(owner).digest("hex");
}

async function myInvitation(req: Request, res: Response) {
  const [invitation] = await db.select().from(invitationsTable).where(eq(invitationsTable.ownerHash, ownerHash(req, res)));
  return invitation;
}

router.use("/mizan", (req, res, next): void => {
  res.setHeader("Cache-Control", "no-store");
  if (["PUT", "POST", "PATCH"].includes(req.method) && !req.is("application/json")) {
    res.status(415).json({ error: "Send JSON data." });
    return;
  }
  if (["PUT", "POST", "PATCH", "DELETE"].includes(req.method) && req.headers.origin) {
    const forwarded = req.get("x-forwarded-host")?.split(",")[0]?.trim();
    const hosts = [req.get("host"), forwarded].filter(Boolean);
    try {
      if (!hosts.includes(new URL(req.headers.origin).host)) {
        res.status(403).json({ error: "Cross-origin changes are not allowed." });
        return;
      }
    } catch {
      res.status(403).json({ error: "Invalid origin." });
      return;
    }
  }
  next();
});

router.get("/mizan/invitation", async (req, res): Promise<void> => {
  const invitation = await myInvitation(req, res);
  res.json(GetMyInvitationResponse.parse({ invitation: invitation ?? null }));
});

router.put("/mizan/invitation", async (req, res): Promise<void> => {
  const parsed = SaveInvitationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check invitation fields.", details: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const date = new Date(`${d.date}T12:00:00Z`);
  if (!d.coupleNames.trim() || !d.eventName.trim() || !d.venue.trim() || !d.location.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== d.date) {
    res.status(400).json({ error: "Names, venue, location and a valid calendar date are required." });
    return;
  }
  const data = { ...d, coupleNames: d.coupleNames.trim(), eventName: d.eventName.trim(), venue: d.venue.trim(), location: d.location.trim(), maxParty: d.allowPlusOnes ? d.maxParty : 1, updatedAt: new Date() };
  const owner = ownerHash(req, res);
  const [saved] = await db.insert(invitationsTable).values({ ...data, ownerHash: owner })
    .onConflictDoUpdate({ target: invitationsTable.ownerHash, set: data }).returning();
  res.json(SaveInvitationResponse.parse(saved));
});

router.get("/mizan/guests", async (req, res): Promise<void> => {
  const invitation = await myInvitation(req, res);
  if (!invitation) { res.json([]); return; }
  const guests = await db.select().from(weddingGuestsTable).where(eq(weddingGuestsTable.eventId, invitation.eventId)).orderBy(asc(weddingGuestsTable.updatedAt));
  res.json(ListWeddingGuestsResponse.parse(guests));
});

function guestData<T extends { name: string; status: string; attendees: number }>(data: T) {
  if (!data.name.trim() || (data.status !== "declined" && data.attendees < 1)) return null;
  return { ...data, name: data.name.trim(), attendees: data.status === "declined" ? 0 : data.attendees, updatedAt: new Date() };
}

router.post("/mizan/guests", async (req, res): Promise<void> => {
  const parsed = AddWeddingGuestBody.safeParse(req.body);
  const data = parsed.success ? guestData(parsed.data) : null;
  if (!data) { res.status(400).json({ error: "A name and valid attendee count are required." }); return; }
  const invitation = await myInvitation(req, res);
  if (!invitation) { res.status(409).json({ error: "Save an invitation before adding guests." }); return; }
  const [guest] = await db.insert(weddingGuestsTable).values({ ...data, eventId: invitation.eventId, source: "manual" }).returning();
  res.status(201).json(AddWeddingGuestResponse.parse(guest));
});

router.patch("/mizan/guests/:id", async (req, res): Promise<void> => {
  const params = EditWeddingGuestParams.safeParse(req.params);
  const parsed = EditWeddingGuestBody.safeParse(req.body);
  const data = parsed.success ? guestData(parsed.data) : null;
  if (!params.success || !data) { res.status(400).json({ error: "Invalid guest data." }); return; }
  const invitation = await myInvitation(req, res);
  if (!invitation) { res.status(404).json({ error: "Guest not found." }); return; }
  const [guest] = await db.update(weddingGuestsTable).set(data)
    .where(and(eq(weddingGuestsTable.id, params.data.id), eq(weddingGuestsTable.eventId, invitation.eventId))).returning();
  if (!guest) { res.status(404).json({ error: "Guest not found." }); return; }
  res.json(EditWeddingGuestResponse.parse(guest));
});

router.delete("/mizan/guests/:id", async (req, res): Promise<void> => {
  const params = RemoveWeddingGuestParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid guest identifier." }); return; }
  const invitation = await myInvitation(req, res);
  if (!invitation) { res.status(404).json({ error: "Guest not found." }); return; }
  const [guest] = await db.delete(weddingGuestsTable)
    .where(and(eq(weddingGuestsTable.id, params.data.id), eq(weddingGuestsTable.eventId, invitation.eventId))).returning();
  if (!guest) { res.status(404).json({ error: "Guest not found." }); return; }
  res.status(204).end();
});

router.get("/mizan/invitations/:token", async (req, res): Promise<void> => {
  const params = GetPublicInvitationParams.safeParse(req.params);
  if (!params.success) { res.status(404).json({ error: "Invitation not found." }); return; }
  const [invitation] = await db.select().from(invitationsTable).where(eq(invitationsTable.token, params.data.token));
  if (!invitation) { res.status(404).json({ error: "Invitation not found." }); return; }
  // Response schema strips owner hash, internal timestamps and any other private columns.
  res.json(GetPublicInvitationResponse.parse(invitation));
});

const rates = new Map<string, { count: number; until: number }>();
router.post("/mizan/invitations/:token/rsvp", async (req, res): Promise<void> => {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  if (rates.size > 10000) for (const [key, value] of rates) if (value.until < now) rates.delete(key);
  const rate = rates.get(ip);
  if (rate && rate.until > now && rate.count >= 120) { res.status(429).json({ error: "Too many responses. Please wait a minute." }); return; }
  rates.set(ip, rate && rate.until > now ? { count: rate.count + 1, until: rate.until } : { count: 1, until: now + 60000 });
  const params = SubmitRsvpParams.safeParse(req.params);
  const parsed = SubmitRsvpBody.safeParse(req.body);
  const data = parsed.success ? guestData(parsed.data) : null;
  if (!params.success || !data) { res.status(400).json({ error: "Check your name, attendance and party size." }); return; }
  const outcome = await db.transaction(async tx => {
    const [invitation] = await tx.select().from(invitationsTable).where(eq(invitationsTable.token, params.data.token)).for("update");
    if (!invitation) return { status: 404, error: "Invitation not found." } as const;
    const limit = invitation.allowPlusOnes ? invitation.maxParty : 1;
    if (data.status === "attending" && data.attendees > limit) return { status: 400, error: `This invitation allows up to ${limit} attendee(s).` } as const;
    const responseKey = data.responseKey ?? randomUUID();
    const values = { eventId: invitation.eventId, name: data.name, status: data.status, attendees: data.attendees, responseKey, source: "rsvp", notes: "", updatedAt: new Date() };
    await tx.insert(weddingGuestsTable).values(values)
      .onConflictDoUpdate({ target: [weddingGuestsTable.eventId, weddingGuestsTable.responseKey], set: { name: values.name, status: values.status, attendees: values.attendees, updatedAt: values.updatedAt } });
    return { status: 200, responseKey, attendance: data.status, attendees: data.attendees } as const;
  });
  if ("error" in outcome) { res.status(outcome.status).json({ error: outcome.error }); return; }
  res.json(SubmitRsvpResponse.parse({ responseKey: outcome.responseKey, status: outcome.attendance, attendees: outcome.attendees }));
});

export default router;
