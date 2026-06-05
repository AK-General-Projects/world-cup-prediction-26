"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { groupPredictions, knockoutPredictions } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";

type PickChange = { round: string; slot: number; teamId: number | null };

export async function saveKnockoutPicks(changes: PickChange[]) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const toDelete = changes.filter((c) => c.teamId === null);
  const toUpsert = changes.filter((c) => c.teamId !== null) as (PickChange & { teamId: number })[];

  await Promise.all([
    ...toDelete.map((c) =>
      db.delete(knockoutPredictions).where(
        and(
          eq(knockoutPredictions.userId, session.user.id),
          eq(knockoutPredictions.round, c.round),
          eq(knockoutPredictions.slot, c.slot),
        ),
      ),
    ),
    ...(toUpsert.length > 0
      ? [
          db
            .insert(knockoutPredictions)
            .values(
              toUpsert.map((c) => ({
                userId: session.user.id,
                round: c.round,
                slot: c.slot,
                teamId: c.teamId,
              })),
            )
            .onConflictDoUpdate({
              target: [knockoutPredictions.userId, knockoutPredictions.round, knockoutPredictions.slot],
              set: { teamId: sql`excluded.team_id`, updatedAt: new Date() },
            }),
        ]
      : []),
  ]);
}

export async function saveGroupPredictions(group: string, orderedTeamIds: number[]) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db
    .insert(groupPredictions)
    .values(
      orderedTeamIds.map((teamId, i) => ({
        userId: session.user.id,
        group,
        teamId,
        predictedPosition: i + 1,
      })),
    )
    .onConflictDoUpdate({
      target: [groupPredictions.userId, groupPredictions.teamId],
      set: {
        predictedPosition: sql`excluded.predicted_position`,
        updatedAt: new Date(),
      },
    });
}
