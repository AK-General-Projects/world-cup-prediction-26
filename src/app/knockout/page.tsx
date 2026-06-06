import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { teams, knockoutBracket, knockoutPredictions, appSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import KnockoutBracket, { type BracketSetup, type Picks } from "@/components/ui/knockout-bracket";

const ROUND_KEYS = ["r32", "r16", "qf", "sf", "final"] as const;

export default async function KnockoutPage() {
  const session = await auth();
  if (!session) redirect("/");

  const settingsRows = await db.select().from(appSettings);
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const knockoutEnabled = s.knockout_enabled === "true";
  const knockoutLocked = s.knockout_locked === "true";

  if (!knockoutEnabled) {
    return (
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <span>←</span><span>Back to Dashboard</span>
        </Link>
        <div className="mt-16 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-gray-800">Knockout stage not yet available</h1>
          <p className="text-sm text-gray-500 mt-2">Check back once the group stage is complete.</p>
        </div>
      </div>
    );
  }

  const allTeams = await db.select().from(teams);
  const teamMap = Object.fromEntries(allTeams.map((t) => [t.id, t]));

  const bracketRows = await db.select().from(knockoutBracket);
  const bracketSetup: BracketSetup = Array.from({ length: 16 }, (_, i) => {
    const row = bracketRows.find((r) => r.matchSlot === i + 1);
    return {
      matchSlot: i + 1,
      team1: row?.team1Id ? (teamMap[row.team1Id] ?? null) : null,
      team2: row?.team2Id ? (teamMap[row.team2Id] ?? null) : null,
    };
  });

  const predsRows = await db
    .select()
    .from(knockoutPredictions)
    .where(eq(knockoutPredictions.userId, session.user.id));

  const initialPicks: Picks = {
    r32: Array(16).fill(null),
    r16: Array(8).fill(null),
    qf: Array(4).fill(null),
    sf: Array(2).fill(null),
    final: Array(1).fill(null),
  };
  for (const p of predsRows) {
    const arr = initialPicks[p.round as typeof ROUND_KEYS[number]];
    if (arr && p.slot >= 1 && p.slot <= arr.length) {
      arr[p.slot - 1] = p.teamId ?? null;
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <span>←</span><span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Knockout Stage</h1>
          {knockoutLocked && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Locked</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {knockoutLocked
            ? "Predictions are locked — knockout matches are underway."
            : "Click a team to advance them to the next round."}
        </p>
      </div>
      {!knockoutLocked && (
        <div className="mb-4 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
          <span className="mt-px">ℹ️</span>
          <span>Predictions lock 1 hour before the first knockout match begins.</span>
        </div>
      )}
      <KnockoutBracket
        bracketSetup={bracketSetup}
        initialPicks={initialPicks}
        teamMap={teamMap}
        isLocked={knockoutLocked}
      />
    </div>
  );
}
