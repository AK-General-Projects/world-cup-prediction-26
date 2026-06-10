import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { appSettings, knockoutBracket, teams, users, actualGroupStandings, actualKnockoutResults, leagues } from "@/server/db/schema";
import AdminPanel from "@/components/ui/admin-panel";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [settingsRows, bracketRows, allTeams, allUsers, actGroupRows, actKoRows, allLeagues] = await Promise.all([
    db.select().from(appSettings),
    db.select().from(knockoutBracket),
    db.select().from(teams),
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role, leagueId: users.leagueId }).from(users),
    db.select().from(actualGroupStandings),
    db.select().from(actualKnockoutResults),
    db.select().from(leagues),
  ]);

  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const settings = {
    group_stage_locked:  s.group_stage_locked  === "true",
    knockout_enabled:    s.knockout_enabled    === "true",
    knockout_locked:     s.knockout_locked     === "true",
    predictions_visible: s.predictions_visible === "true",
  };

  const bracket = Array.from({ length: 16 }, (_, i) => {
    const row = bracketRows.find((r) => r.matchSlot === i + 1);
    return { matchSlot: i + 1, team1Id: row?.team1Id ?? null, team2Id: row?.team2Id ?? null };
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <span>←</span><span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>
      <AdminPanel
        settings={settings}
        bracket={bracket}
        teams={allTeams}
        users={allUsers}
        leagues={allLeagues}
        actualGroupStandings={actGroupRows}
        actualKnockoutResults={actKoRows}
      />
    </div>
  );
}
