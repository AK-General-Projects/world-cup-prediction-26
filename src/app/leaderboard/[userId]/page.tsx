import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import {
  users, teams, groupPredictions, knockoutPredictions,
  knockoutBracket, appSettings,
  actualGroupStandings, actualKnockoutResults,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import GroupStandingsView from "@/components/ui/group-standings-view";
import KnockoutResultsView from "@/components/ui/knockout-results-view";
import type { RoundKey } from "@/components/ui/knockout-results-view";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UserPredictionsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) notFound();

  const session = await auth();
  if (!session) redirect("/");

  const settingsRows = await db.select().from(appSettings);
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const predictionsVisible = s.predictions_visible === "true";
  const isAdmin = session.user.role === "admin";
  const isOwnProfile = session.user.id === userId;

  if (!isAdmin && !predictionsVisible && !isOwnProfile) redirect("/leaderboard");

  const [targetUser] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, userId));
  if (!targetUser) notFound();

  const [allTeams, groupPreds, knockoutPreds, bracketRows, actGroupRows, actKoRows] = await Promise.all([
    db.select().from(teams),
    db.select().from(groupPredictions).where(eq(groupPredictions.userId, userId)),
    db.select().from(knockoutPredictions).where(eq(knockoutPredictions.userId, userId)),
    db.select().from(knockoutBracket),
    db.select().from(actualGroupStandings),
    db.select().from(actualKnockoutResults),
  ]);

  const teamMap = Object.fromEntries(allTeams.map((t) => [t.id, t]));

  // Build grouped predictions for group stage view
  const predMap = new Map(groupPreds.map((p) => [p.teamId, p.predictedPosition]));
  const grouped: Record<string, { id: number; name: string; flagCode: string }[]> = {};
  for (const team of allTeams) {
    if (!grouped[team.group]) grouped[team.group] = [];
    grouped[team.group].push({ id: team.id, name: team.name, flagCode: team.flagCode });
  }
  for (const letter of Object.keys(grouped)) {
    grouped[letter].sort((a, b) => (predMap.get(a.id) ?? 999) - (predMap.get(b.id) ?? 999));
  }

  // actualStandings: teamId → actual position
  const actualStandings: Record<number, number> = {};
  for (const r of actGroupRows) actualStandings[r.teamId] = r.position;

  // Build bracket setup for knockout view
  const bracketSetup = Array.from({ length: 16 }, (_, i) => {
    const row = bracketRows.find((r) => r.matchSlot === i + 1);
    return {
      matchSlot: i + 1,
      team1: row?.team1Id ? (teamMap[row.team1Id] ?? null) : null,
      team2: row?.team2Id ? (teamMap[row.team2Id] ?? null) : null,
    };
  });

  // Build user picks for knockout view
  const ROUND_KEYS: RoundKey[] = ["r32", "r16", "qf", "sf", "final"];
  const ROUND_COUNTS: Record<RoundKey, number> = { r32: 16, r16: 8, qf: 4, sf: 2, final: 1 };
  const picks = Object.fromEntries(
    ROUND_KEYS.map((rk) => [rk, Array<number | null>(ROUND_COUNTS[rk]).fill(null)])
  ) as Record<RoundKey, (number | null)[]>;
  for (const p of knockoutPreds) {
    const arr = picks[p.round as RoundKey];
    if (arr && p.slot >= 1 && p.slot <= arr.length) arr[p.slot - 1] = p.teamId ?? null;
  }

  // Build actual knockout picks
  const actualPicks = Object.fromEntries(
    ROUND_KEYS.map((rk) => [rk, Array<number | null>(ROUND_COUNTS[rk]).fill(null)])
  ) as Record<RoundKey, (number | null)[]>;
  const hasActualKo = actKoRows.length > 0;
  for (const r of actKoRows) {
    const arr = actualPicks[r.round as RoundKey];
    if (arr && r.slot >= 1 && r.slot <= arr.length) arr[r.slot - 1] = r.teamId ?? null;
  }

  const hasGroupPreds = groupPreds.length > 0;
  const hasKnockoutPreds = knockoutPreds.length > 0;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <span>←</span>
          <span>Back to Leaderboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {targetUser.name}
          {isOwnProfile && <span className="ml-2 text-base font-normal text-gray-400">(you)</span>}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Predictions</p>
      </div>

      {/* Group Stage */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Stage</h2>
        {hasGroupPreds ? (
          <GroupStandingsView groups={grouped} actualStandings={actualStandings} />
        ) : (
          <p className="text-sm text-gray-400">No group predictions submitted.</p>
        )}
      </section>

      {/* Knockout Stage */}
      {s.knockout_enabled === "true" && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Knockout Stage</h2>
          {hasKnockoutPreds ? (
            <KnockoutResultsView
              bracketSetup={bracketSetup}
              picks={picks}
              actualPicks={hasActualKo ? actualPicks : undefined}
              teamMap={teamMap}
            />
          ) : (
            <p className="text-sm text-gray-400">No knockout predictions submitted.</p>
          )}
        </section>
      )}
    </div>
  );
}
