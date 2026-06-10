"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { appSettings, knockoutBracket, users, actualGroupStandings, actualKnockoutResults, leagues } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");
  return session;
}

export async function updateSetting(key: string, value: string) {
  await requireAdmin();
  await db.insert(appSettings).values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } });
}

export async function saveBracketMatchup(
  matchSlot: number,
  team1Id: number | null,
  team2Id: number | null,
) {
  await requireAdmin();
  await db.insert(knockoutBracket).values({ matchSlot, team1Id, team2Id })
    .onConflictDoUpdate({
      target: knockoutBracket.matchSlot,
      set: { team1Id, team2Id },
    });
}

export async function createUser(name: string, email: string, password: string, leagueId: number) {
  await requireAdmin();
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash, role: "user", leagueId });
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  await db.delete(users).where(eq(users.id, userId));
}

export async function createLeague(name: string) {
  await requireAdmin();
  const [league] = await db.insert(leagues).values({ name }).returning();
  return league;
}

export async function assignUserLeague(userId: string, leagueId: number) {
  await requireAdmin();
  await db.update(users).set({ leagueId }).where(eq(users.id, userId));
}

export async function saveActualGroupStandings(group: string, orderedTeamIds: (number | null)[]) {
  await requireAdmin();
  await db.delete(actualGroupStandings).where(eq(actualGroupStandings.group, group));
  const seen = new Set<number>();
  const rows = orderedTeamIds
    .map((teamId, i) => {
      if (teamId === null || seen.has(teamId)) return null;
      seen.add(teamId);
      return { group, teamId, position: i + 1 };
    })
    .filter((r): r is { group: string; teamId: number; position: number } => r !== null);
  if (rows.length > 0) {
    await db.insert(actualGroupStandings).values(rows);
  }
}

export async function saveActualKnockoutResult(round: string, slot: number, teamId: number | null) {
  await requireAdmin();
  if (teamId === null) {
    await db.delete(actualKnockoutResults).where(
      and(eq(actualKnockoutResults.round, round), eq(actualKnockoutResults.slot, slot)),
    );
  } else {
    await db.insert(actualKnockoutResults)
      .values({ round, slot, teamId })
      .onConflictDoUpdate({
        target: [actualKnockoutResults.round, actualKnockoutResults.slot],
        set: { teamId },
      });
  }
}
