import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { appSettings, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getLeaderboard } from "@/server/services/scoring";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const settingsRows = await db.select().from(appSettings);
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const predictionsVisible = s.predictions_visible === "true";
  const isAdmin = session.user.role === "admin";

  const [me] = await db.select({ leagueId: users.leagueId }).from(users).where(eq(users.id, session.user.id));
  const scores = me?.leagueId ? await getLeaderboard(me.leagueId) : [];

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
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-1">Points are awarded after each stage of the tournament.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium w-12">Rank</th>
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 font-medium text-right">Group pts</th>
              <th className="px-4 py-3 font-medium text-right">Knockout pts</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {scores.map((row, i) => {
              const canView = isAdmin || predictionsVisible || row.userId === session.user.id;
              const isCurrentUser = row.userId === session.user.id;

              return (
                <tr
                  key={row.userId}
                  className={`transition-colors ${canView ? "hover:bg-gray-50" : ""} ${isCurrentUser ? "bg-green-50/40" : ""}`}
                >
                  <td className="px-4 py-3 text-sm font-bold text-gray-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </td>
                  <td className="px-4 py-3">
                    {canView ? (
                      <Link
                        href={`/leaderboard/${row.userId}`}
                        className="text-sm font-medium text-gray-900 hover:text-green-700 transition-colors"
                      >
                        {row.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {row.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{row.groupPoints}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{row.knockoutPoints}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-gray-900">{row.total}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {scores.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">No players yet.</div>
        )}
      </div>

      {!predictionsVisible && !isAdmin && (
        <p className="mt-4 text-xs text-gray-400 text-center">
          Prediction details will be visible once the admin opens them.
        </p>
      )}
    </div>
  );
}
