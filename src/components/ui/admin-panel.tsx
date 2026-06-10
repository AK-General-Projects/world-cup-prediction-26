"use client";

import { useState } from "react";
import {
  updateSetting, saveBracketMatchup, createUser, deleteUser,
  saveActualGroupStandings, saveActualKnockoutResult,
  createLeague, assignUserLeague,
} from "@/server/actions/admin";

type Team = { id: number; name: string; flagCode: string; group: string };
type User = { id: string; name: string; email: string; role: string; leagueId: number | null };
type League = { id: number; name: string };
type Settings = {
  group_stage_locked: boolean;
  knockout_enabled: boolean;
  knockout_locked: boolean;
  predictions_visible: boolean;
};
type Bracket = { matchSlot: number; team1Id: number | null; team2Id: number | null }[];
type ActualGroupRow = { group: string; teamId: number; position: number };
type ActualKoRow = { round: string; slot: number; teamId: number | null };

interface Props {
  settings: Settings;
  bracket: Bracket;
  teams: Team[];
  users: User[];
  leagues: League[];
  actualGroupStandings: ActualGroupRow[];
  actualKnockoutResults: ActualKoRow[];
}

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const ROUND_KEYS = ["r32", "r16", "qf", "sf", "final"] as const;
type RoundKey = typeof ROUND_KEYS[number];
const ROUND_LABELS: Record<RoundKey, string> = {
  r32: "Round of 32", r16: "Round of 16", qf: "Quarter-finals", sf: "Semi-finals", final: "Final",
};
const ROUND_COUNTS: Record<RoundKey, number> = { r32: 16, r16: 8, qf: 4, sf: 2, final: 1 };

function Toggle({ label, description, value, onToggle }: {
  label: string; description: string; value: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
}

function initGroupStandings(teams: Team[], rows: ActualGroupRow[]): Record<string, (number | null)[]> {
  const result: Record<string, (number | null)[]> = {};
  for (const g of GROUPS) result[g] = [null, null, null, null];
  for (const row of rows) {
    if (result[row.group]) result[row.group][row.position - 1] = row.teamId;
  }
  return result;
}

function initKoResults(rows: ActualKoRow[]): Record<RoundKey, (number | null)[]> {
  const result = Object.fromEntries(
    ROUND_KEYS.map((rk) => [rk, Array<number | null>(ROUND_COUNTS[rk]).fill(null)])
  ) as Record<RoundKey, (number | null)[]>;
  for (const row of rows) {
    const arr = result[row.round as RoundKey];
    if (arr && row.slot >= 1 && row.slot <= arr.length) arr[row.slot - 1] = row.teamId ?? null;
  }
  return result;
}

export default function AdminPanel({
  settings: initSettings, bracket: initBracket, teams, users: initUsers, leagues: initLeagues,
  actualGroupStandings: initActualGroup, actualKnockoutResults: initActualKo,
}: Props) {
  const [settings, setSettings] = useState(initSettings);
  const [bracket, setBracket] = useState(initBracket);
  const [users, setUsers] = useState(initUsers);
  const [leagues, setLeagues] = useState(initLeagues);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [leagueError, setLeagueError] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", leagueId: initLeagues[0]?.id ?? 0 });
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [groupStandings, setGroupStandings] = useState(() => initGroupStandings(teams, initActualGroup));
  const [koResults, setKoResults] = useState(() => initKoResults(initActualKo));
  const [adminError, setAdminError] = useState<string | null>(null);

  function showError(msg: string) {
    setAdminError(msg);
    setTimeout(() => setAdminError(null), 5000);
  }

  async function handleToggle(key: keyof Settings) {
    const val = !settings[key];
    setSettings((s) => ({ ...s, [key]: val }));
    try {
      await updateSetting(key, String(val));
    } catch {
      setSettings((s) => ({ ...s, [key]: !val }));
      showError("Failed to save setting — please try again.");
    }
  }

  async function handleBracketChange(matchSlot: number, field: "team1Id" | "team2Id", value: string) {
    const teamId = value ? parseInt(value) : null;
    const match = bracket.find((m) => m.matchSlot === matchSlot)!;
    const oldVal = match[field];
    setBracket((b) => b.map((m) => m.matchSlot === matchSlot ? { ...m, [field]: teamId } : m));
    try {
      const t1 = field === "team1Id" ? teamId : match.team1Id;
      const t2 = field === "team2Id" ? teamId : match.team2Id;
      await saveBracketMatchup(matchSlot, t1, t2);
    } catch {
      setBracket((b) => b.map((m) => m.matchSlot === matchSlot ? { ...m, [field]: oldVal } : m));
      showError("Failed to save bracket matchup — please try again.");
    }
  }

  async function handleGroupStandingChange(group: string, posIdx: number, value: string) {
    const teamId = value ? parseInt(value) : null;
    const prev = groupStandings[group];
    const updated = [...prev];
    updated[posIdx] = teamId;
    setGroupStandings((s) => ({ ...s, [group]: updated }));
    try {
      await saveActualGroupStandings(group, updated);
    } catch {
      setGroupStandings((s) => ({ ...s, [group]: prev }));
      showError("Failed to save group standings — please try again.");
    }
  }

  async function handleKoResultChange(round: RoundKey, slotIdx: number, value: string) {
    const teamId = value ? parseInt(value) : null;
    const prev = koResults[round];
    const updated = [...prev];
    updated[slotIdx] = teamId;
    setKoResults((s) => ({ ...s, [round]: updated }));
    try {
      await saveActualKnockoutResult(round, slotIdx + 1, teamId);
    } catch {
      setKoResults((s) => ({ ...s, [round]: prev }));
      showError("Failed to save knockout result — please try again.");
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    try {
      await createUser(newUser.name, newUser.email, newUser.password, newUser.leagueId);
      setUsers((u) => [...u, { id: crypto.randomUUID(), name: newUser.name, email: newUser.email, role: "user", leagueId: newUser.leagueId }]);
      setNewUser({ name: "", email: "", password: "", leagueId: leagues[0]?.id ?? 0 });
      setUserSuccess("User created.");
    } catch {
      setUserError("Username already exists or error creating user.");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Remove this user? This will also delete all their predictions.")) return;
    try {
      await deleteUser(userId);
      setUsers((u) => u.filter((x) => x.id !== userId));
    } catch {
      showError("Failed to remove user — please try again.");
    }
  }

  async function handleCreateLeague(e: React.FormEvent) {
    e.preventDefault();
    setLeagueError("");
    const name = newLeagueName.trim();
    if (!name) return;
    try {
      const league = await createLeague(name);
      setLeagues((l) => [...l, league]);
      setNewLeagueName("");
    } catch {
      setLeagueError("League already exists or error creating league.");
    }
  }

  async function handleAssignLeague(userId: string, leagueId: number) {
    const prev = users.find((u) => u.id === userId)?.leagueId ?? null;
    setUsers((u) => u.map((x) => x.id === userId ? { ...x, leagueId } : x));
    try {
      await assignUserLeague(userId, leagueId);
    } catch {
      setUsers((u) => u.map((x) => x.id === userId ? { ...x, leagueId: prev } : x));
      showError("Failed to assign league — please try again.");
    }
  }

  const teamOptions = (
    <>
      <option value="">— none —</option>
      {GROUPS.map((g) => (
        <optgroup key={g} label={`Group ${g}`}>
          {teams.filter((t) => t.group === g).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </optgroup>
      ))}
    </>
  );

  return (
    <div className="space-y-8">

      {adminError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <span>⚠️</span>
          <span>{adminError}</span>
        </div>
      )}

      {/* Stage Controls */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Stage Controls</h2>
        <Toggle
          label="Lock Group Stage"
          description="Prevents users from editing group predictions."
          value={settings.group_stage_locked}
          onToggle={() => handleToggle("group_stage_locked")}
        />
        <Toggle
          label="Enable Knockout Stage"
          description="Opens knockout predictions to all users."
          value={settings.knockout_enabled}
          onToggle={() => handleToggle("knockout_enabled")}
        />
        <Toggle
          label="Lock Knockout Stage"
          description="Prevents users from editing knockout predictions."
          value={settings.knockout_locked}
          onToggle={() => handleToggle("knockout_locked")}
        />
        <Toggle
          label="Show Predictions on Leaderboard"
          description="Allows users to click through and see each other's predictions."
          value={settings.predictions_visible}
          onToggle={() => handleToggle("predictions_visible")}
        />
      </section>

      {/* Round of 32 Bracket Setup */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Round of 32 Bracket</h2>
        <p className="text-xs text-gray-500 mb-4">Set the 16 matchups. Changes save automatically.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {bracket.map((match) => (
            <div key={match.matchSlot} className="flex items-center gap-2 py-1.5">
              <span className="text-xs text-gray-400 w-14 flex-shrink-0">Match {match.matchSlot}</span>
              <select
                value={match.team1Id ?? ""}
                onChange={(e) => handleBracketChange(match.matchSlot, "team1Id", e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
              >
                {teamOptions}
              </select>
              <span className="text-xs text-gray-400">vs</span>
              <select
                value={match.team2Id ?? ""}
                onChange={(e) => handleBracketChange(match.matchSlot, "team2Id", e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
              >
                {teamOptions}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Actual Group Standings */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Actual Group Standings</h2>
        <p className="text-xs text-gray-500 mb-4">Enter the real final standings to score predictions. Changes save automatically.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GROUPS.map((g) => {
            const groupTeams = teams.filter((t) => t.group === g);
            return (
              <div key={g} className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-700">Group {g}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {[0, 1, 2, 3].map((posIdx) => (
                    <div key={posIdx} className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-xs font-bold text-gray-400 w-3">{posIdx + 1}</span>
                      <select
                        value={groupStandings[g][posIdx] ?? ""}
                        onChange={(e) => handleGroupStandingChange(g, posIdx, e.target.value)}
                        className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
                      >
                        <option value="">— TBD —</option>
                        {groupTeams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Actual Knockout Results */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Actual Knockout Results</h2>
        <p className="text-xs text-gray-500 mb-4">Enter match winners as each round completes. Changes save automatically.</p>
        <div className="space-y-5">
          {ROUND_KEYS.map((rk) => (
            <div key={rk}>
              <h3 className="text-xs font-semibold text-gray-600 mb-2">{ROUND_LABELS[rk]}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {Array.from({ length: ROUND_COUNTS[rk] }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12 flex-shrink-0">Slot {i + 1}</span>
                    <select
                      value={koResults[rk][i] ?? ""}
                      onChange={(e) => handleKoResultChange(rk, i, e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
                    >
                      {teamOptions}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leagues */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Leagues</h2>
        <p className="text-xs text-gray-500 mb-4">Each user belongs to one league. Leaderboards are scoped per league.</p>

        <form onSubmit={handleCreateLeague} className="flex flex-wrap gap-2 mb-4">
          <input
            placeholder="League name" required value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 w-48"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded transition-colors">
            Add league
          </button>
          {leagueError && <p className="w-full text-xs text-red-500">{leagueError}</p>}
        </form>

        <div className="flex flex-wrap gap-2">
          {leagues.map((l) => (
            <span key={l.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{l.name}</span>
          ))}
        </div>
      </section>

      {/* User Management */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Users</h2>

        <form onSubmit={handleCreateUser} className="flex flex-wrap gap-2 mb-5">
          <input
            placeholder="Name" required value={newUser.name}
            onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 w-32"
          />
          <input
            placeholder="Username" required value={newUser.email}
            onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 w-32"
          />
          <input
            type="password" placeholder="Password" required value={newUser.password}
            onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 w-32"
          />
          <select
            required value={newUser.leagueId}
            onChange={(e) => setNewUser((u) => ({ ...u, leagueId: parseInt(e.target.value) }))}
            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
          >
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded transition-colors">
            Add user
          </button>
          {userError   && <p className="w-full text-xs text-red-500">{userError}</p>}
          {userSuccess && <p className="w-full text-xs text-green-500">{userSuccess}</p>}
        </form>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Username</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">League</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="py-2">{u.name}</td>
                <td className="py-2 text-gray-500">{u.email}</td>
                <td className="py-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    u.role === "admin" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                  }`}>{u.role}</span>
                </td>
                <td className="py-2">
                  <select
                    value={u.leagueId ?? ""}
                    onChange={(e) => handleAssignLeague(u.id, parseInt(e.target.value))}
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
                  >
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 text-right">
                  {u.role !== "admin" && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
