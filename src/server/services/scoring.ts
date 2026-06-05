import { db } from "@/server/db";
import { users, groupPredictions, knockoutPredictions, actualGroupStandings, actualKnockoutResults } from "@/server/db/schema";

export type UserScore = {
  userId: string;
  name: string;
  groupPoints: number;
  knockoutPoints: number;
  total: number;
};

export async function getLeaderboard(): Promise<UserScore[]> {
  const [allUsers, allGroupPreds, allKnockoutPreds, actGroupRows, actKoRows] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users),
    db.select().from(groupPredictions),
    db.select().from(knockoutPredictions),
    db.select().from(actualGroupStandings),
    db.select().from(actualKnockoutResults),
  ]);

  // teamId → actual position
  const actGroupMap = new Map<number, number>();
  for (const s of actGroupRows) actGroupMap.set(s.teamId, s.position);

  // "round:slot" → teamId
  const actKoMap = new Map<string, number | null>();
  for (const r of actKoRows) actKoMap.set(`${r.round}:${r.slot}`, r.teamId ?? null);

  const scores = allUsers.map((user) => {
    let groupPoints = 0;
    for (const p of allGroupPreds) {
      if (p.userId !== user.id) continue;
      const actual = actGroupMap.get(p.teamId);
      if (actual !== undefined && actual === p.predictedPosition) groupPoints++;
    }

    let knockoutPoints = 0;
    for (const p of allKnockoutPreds) {
      if (p.userId !== user.id) continue;
      const actual = actKoMap.get(`${p.round}:${p.slot}`);
      if (actual !== undefined && actual !== null && actual === p.teamId) {
        knockoutPoints += p.round === "final" ? 2 : 1;
      }
    }

    return { userId: user.id, name: user.name, groupPoints, knockoutPoints, total: groupPoints + knockoutPoints };
  });

  return scores.sort((a, b) => b.total - a.total);
}
