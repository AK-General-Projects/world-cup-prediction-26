import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { teams, groupPredictions, appSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import GroupBoard from "@/components/ui/group-board";

export default async function GroupsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const settingsRows = await db.select().from(appSettings);
  const groupStageLocked = settingsRows.find((s) => s.key === "group_stage_locked")?.value === "true";

  const [allTeams, predictions] = await Promise.all([
    db.select().from(teams),
    db.select().from(groupPredictions).where(eq(groupPredictions.userId, session.user.id)),
  ]);

  const predMap = new Map(predictions.map((p) => [p.teamId, p.predictedPosition]));

  const grouped: Record<string, { id: number; name: string; flagCode: string }[]> = {};
  for (const team of allTeams) {
    if (!grouped[team.group]) grouped[team.group] = [];
    grouped[team.group].push({ id: team.id, name: team.name, flagCode: team.flagCode });
  }

  for (const letter of Object.keys(grouped)) {
    grouped[letter].sort((a, b) => {
      const posA = predMap.get(a.id) ?? 999;
      const posB = predMap.get(b.id) ?? 999;
      return posA - posB;
    });
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Group Stage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Drag teams to predict their final group standings.
        </p>
      </div>
      {groupStageLocked && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <span>🔒</span>
          <span>Group stage predictions are locked — matches have begun.</span>
        </div>
      )}
      <GroupBoard initialGroups={grouped} isLocked={groupStageLocked} />
    </div>
  );
}
