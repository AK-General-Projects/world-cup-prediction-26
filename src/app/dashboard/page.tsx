import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { appSettings } from "@/server/db/schema";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const isAdmin = session.user.role === "admin";

  const settingsRows = await db.select().from(appSettings);
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const groupStageLocked = s.group_stage_locked === "true";
  const knockoutEnabled = s.knockout_enabled === "true";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome, {session.user.name}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Make your 2026 World Cup predictions below.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Group Stage */}
        <Link
          href="/groups"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl mb-3">🏟️</div>
          <h2 className="font-semibold text-gray-900 group-hover:text-green-700">Group Stage</h2>
          <p className="text-sm text-gray-500 mt-1">Predict final standings for all 12 groups.</p>
          {groupStageLocked && (
            <span className="inline-block mt-3 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Locked</span>
          )}
        </Link>

        {/* Knockout Stage */}
        {knockoutEnabled ? (
          <Link
            href="/knockout"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-sm transition-all group"
          >
            <div className="text-2xl mb-3">🏆</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-green-700">Knockout Stage</h2>
            <p className="text-sm text-gray-500 mt-1">Fill in the full bracket from R32 to Final.</p>
          </Link>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 opacity-50 cursor-not-allowed">
            <div className="text-2xl mb-3">🏆</div>
            <h2 className="font-semibold text-gray-900">Knockout Stage</h2>
            <p className="text-sm text-gray-500 mt-1">Available once group stage is complete.</p>
            <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Locked</span>
          </div>
        )}

        {/* Leaderboard */}
        <Link
          href="/leaderboard"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl mb-3">🏅</div>
          <h2 className="font-semibold text-gray-900 group-hover:text-green-700">Leaderboard</h2>
          <p className="text-sm text-gray-500 mt-1">See how everyone is scoring so far.</p>
        </Link>

        {/* Admin */}
        {isAdmin && (
          <Link
            href="/admin"
            className="bg-white border border-yellow-200 rounded-xl p-6 hover:border-yellow-400 hover:shadow-sm transition-all group"
          >
            <div className="text-2xl mb-3">⚙️</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-yellow-700">Admin Panel</h2>
            <p className="text-sm text-gray-500 mt-1">Enroll users and manage the competition.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
