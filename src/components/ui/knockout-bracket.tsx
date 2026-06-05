"use client";

import { useState, Fragment } from "react";
import { cn } from "@/lib/utils";
import { saveKnockoutPicks } from "@/server/actions/predictions";

// ─── Constants ───────────────────────────────────────────────────────────────
const CARD_H = 56;   // total match card height (2 × 28px team rows)
const CARD_W = 148;
const CONN_W = 20;
const TOTAL_H = 16 * CARD_H; // 896px

// ─── Types ────────────────────────────────────────────────────────────────────
export type Team = { id: number; name: string; flagCode: string };
export type BracketSetup = { matchSlot: number; team1: Team | null; team2: Team | null }[];
export type RoundKey = "r32" | "r16" | "qf" | "sf" | "final";
export type Picks = { [K in RoundKey]: (number | null)[] };

const ROUND_KEYS: RoundKey[] = ["r32", "r16", "qf", "sf", "final"];
const ROUND_CONFIG: Record<RoundKey, { label: string; count: number }> = {
  r32:   { label: "Round of 32",    count: 16 },
  r16:   { label: "Round of 16",    count: 8  },
  qf:    { label: "Quarter-finals", count: 4  },
  sf:    { label: "Semi-finals",    count: 2  },
  final: { label: "Final",          count: 1  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slotH(roundIdx: number) { return CARD_H * Math.pow(2, roundIdx); }
function cardTop(roundIdx: number, matchIdx: number) {
  const sh = slotH(roundIdx);
  return matchIdx * sh + (sh - CARD_H) / 2;
}
function centerY(roundIdx: number, matchIdx: number) {
  return matchIdx * slotH(roundIdx) + slotH(roundIdx) / 2;
}

function getMatchTeams(
  roundIdx: number,
  matchIdx: number,
  picks: Picks,
  bracketSetup: BracketSetup,
  teamMap: Record<number, Team>,
): [Team | null, Team | null] {
  if (roundIdx === 0) {
    const m = bracketSetup[matchIdx];
    return [m?.team1 ?? null, m?.team2 ?? null];
  }
  const prev = ROUND_KEYS[roundIdx - 1];
  const t1id = picks[prev][matchIdx * 2];
  const t2id = picks[prev][matchIdx * 2 + 1];
  return [
    t1id != null ? (teamMap[t1id] ?? null) : null,
    t2id != null ? (teamMap[t2id] ?? null) : null,
  ];
}

function applyPick(picks: Picks, roundIdx: number, matchIdx: number, teamId: number): Picks {
  const rk = ROUND_KEYS[roundIdx];
  const old = picks[rk][matchIdx];
  const next = old === teamId ? null : teamId;

  let result: Picks = { ...picks, [rk]: picks[rk].map((p, i) => (i === matchIdx ? next : p)) };

  if (old != null) {
    let si = matchIdx;
    for (let ri = roundIdx + 1; ri < ROUND_KEYS.length; ri++) {
      const nrk = ROUND_KEYS[ri];
      const ni = Math.floor(si / 2);
      if (result[nrk][ni] === old) {
        result = { ...result, [nrk]: result[nrk].map((p, i) => (i === ni ? null : p)) };
        si = ni;
      } else break;
    }
  }
  return result;
}

function getChanges(a: Picks, b: Picks) {
  const out: { round: string; slot: number; teamId: number | null }[] = [];
  for (const rk of ROUND_KEYS) {
    for (let i = 0; i < b[rk].length; i++) {
      if (a[rk][i] !== b[rk][i]) out.push({ round: rk, slot: i + 1, teamId: b[rk][i] });
    }
  }
  return out;
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({
  team1, team2, winner, isLocked, onPick,
}: {
  team1: Team | null; team2: Team | null;
  winner: number | null; isLocked: boolean;
  onPick: (id: number) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm" style={{ width: CARD_W }}>
      {([team1, team2] as (Team | null)[]).map((team, i) => (
        <button
          key={i}
          onClick={() => team && !isLocked && onPick(team.id)}
          disabled={!team || isLocked}
          className={cn(
            "w-full flex items-center gap-1.5 px-2 text-left transition-colors",
            i === 0 && "border-b border-gray-100",
            team && winner === team.id && "bg-green-50",
            team && winner != null && winner !== team.id && "opacity-40",
            team && !isLocked && "hover:bg-gray-50 cursor-pointer",
          )}
          style={{ height: CARD_H / 2 }}
        >
          {team ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/16x12/${team.flagCode}.png`} width={16} height={12} alt="" className="rounded-sm flex-shrink-0" />
              <span className="text-xs truncate flex-1">{team.name}</span>
              {winner === team.id && <span className="text-green-500 text-xs flex-shrink-0">✓</span>}
            </>
          ) : (
            <span className="text-gray-300 text-xs italic px-1">TBD</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  bracketSetup: BracketSetup;
  initialPicks: Picks;
  teamMap: Record<number, Team>;
  isLocked: boolean;
}

export default function KnockoutBracket({ bracketSetup, initialPicks, teamMap, isLocked }: Props) {
  const [picks, setPicks] = useState<Picks>(initialPicks);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handlePick(roundIdx: number, matchIdx: number, teamId: number) {
    if (isLocked) return;
    const prevPicks = picks;
    const newPicks = applyPick(picks, roundIdx, matchIdx, teamId);
    const changes = getChanges(picks, newPicks);
    setPicks(newPicks);
    if (changes.length === 0) return;
    setSaveStatus("saving");
    try {
      await saveKnockoutPicks(changes);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setPicks(prevPicks);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 5000);
    }
  }

  const totalWidth = ROUND_KEYS.length * CARD_W + (ROUND_KEYS.length - 1) * CONN_W;

  return (
    <div>
      <div className="flex justify-end mb-2 h-5">
        {saveStatus === "saving" && <span className="text-xs text-gray-400">Saving...</span>}
        {saveStatus === "saved"  && <span className="text-xs text-green-500">Saved ✓</span>}
        {saveStatus === "error"  && <span className="text-xs text-red-500">Failed to save — please try again.</span>}
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex" style={{ width: totalWidth }}>
          {ROUND_KEYS.map((rk, ri) => {
            const { label, count } = ROUND_CONFIG[rk];
            const isLast = ri === ROUND_KEYS.length - 1;

            return (
              <Fragment key={rk}>
                {/* Round column */}
                <div className="flex-shrink-0" style={{ width: CARD_W }}>
                  <div className="text-center text-xs font-medium text-gray-500 mb-3 whitespace-nowrap truncate px-1">
                    {label}
                  </div>
                  <div className="relative" style={{ height: TOTAL_H }}>
                    {Array.from({ length: count }, (_, mi) => {
                      const [t1, t2] = getMatchTeams(ri, mi, picks, bracketSetup, teamMap);
                      return (
                        <div key={mi} style={{ position: "absolute", top: cardTop(ri, mi) }}>
                          <MatchCard
                            team1={t1} team2={t2}
                            winner={picks[rk][mi]}
                            isLocked={isLocked}
                            onPick={(id) => handlePick(ri, mi, id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Connector column */}
                {!isLast && (
                  <div className="flex-shrink-0" style={{ width: CONN_W }}>
                    <div style={{ height: "1.75rem" }} />
                    <div className="relative" style={{ height: TOTAL_H }}>
                      {Array.from({ length: count / 2 }, (_, pi) => {
                        const ya = centerY(ri, pi * 2);
                        const yb = centerY(ri, pi * 2 + 1);
                        const ym = (ya + yb) / 2;
                        const hw = CONN_W / 2;
                        return (
                          <Fragment key={pi}>
                            <div style={{ position: "absolute", left: 0,  top: ya - 0.5, width: hw, height: 1 }} className="bg-gray-200" />
                            <div style={{ position: "absolute", left: 0,  top: yb - 0.5, width: hw, height: 1 }} className="bg-gray-200" />
                            <div style={{ position: "absolute", left: hw - 0.5, top: ya, width: 1, height: yb - ya }} className="bg-gray-200" />
                            <div style={{ position: "absolute", left: hw, top: ym - 0.5, width: hw, height: 1 }} className="bg-gray-200" />
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
