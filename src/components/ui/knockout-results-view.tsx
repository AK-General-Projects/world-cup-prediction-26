import { Fragment } from "react";
import { cn } from "@/lib/utils";

const CARD_H = 56;
const CARD_W = 148;
const CONN_W = 20;
const TOTAL_H = 16 * CARD_H;

type Team = { id: number; name: string; flagCode: string };
export type RoundKey = "r32" | "r16" | "qf" | "sf" | "final";
type Picks = { [K in RoundKey]: (number | null)[] };
type BracketSetup = { matchSlot: number; team1: Team | null; team2: Team | null }[];

const ROUND_KEYS: RoundKey[] = ["r32", "r16", "qf", "sf", "final"];
const ROUND_CONFIG: Record<RoundKey, { label: string; count: number }> = {
  r32:   { label: "Round of 32",    count: 16 },
  r16:   { label: "Round of 16",    count: 8  },
  qf:    { label: "Quarter-finals", count: 4  },
  sf:    { label: "Semi-finals",    count: 2  },
  final: { label: "Final",          count: 1  },
};

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

function ResultMatchCard({
  team1, team2, userPick, actualWinner,
}: {
  team1: Team | null;
  team2: Team | null;
  userPick: number | null;
  actualWinner: number | null | undefined; // undefined = no actual data yet
}) {
  const hasActual = actualWinner !== undefined;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm" style={{ width: CARD_W }}>
      {([team1, team2] as (Team | null)[]).map((team, i) => {
        const isUserPick = team !== null && userPick === team.id;
        const isActualWinner = team !== null && actualWinner === team.id;
        const isCorrect = isUserPick && isActualWinner;
        const isWrong = isUserPick && hasActual && !isActualWinner;

        const bgClass = isCorrect ? "bg-green-50" : isWrong ? "bg-red-50" : isUserPick ? "bg-green-50" : "";

        return (
          <div
            key={i}
            className={cn(
              "w-full flex items-center gap-1.5 px-2",
              i === 0 && "border-b border-gray-100",
              bgClass,
              team && userPick !== null && !isUserPick && "opacity-40",
            )}
            style={{ height: CARD_H / 2 }}
          >
            {team ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/16x12/${team.flagCode}.png`} width={16} height={12} alt="" className="rounded-sm flex-shrink-0" />
                <span className="text-xs truncate flex-1">{team.name}</span>
                {isCorrect && <span className="text-green-500 text-xs flex-shrink-0">✓</span>}
                {isWrong   && <span className="text-red-400   text-xs flex-shrink-0">✗</span>}
                {isUserPick && !hasActual && <span className="text-green-500 text-xs flex-shrink-0">✓</span>}
              </>
            ) : (
              <span className="text-gray-300 text-xs italic px-1">TBD</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  bracketSetup: BracketSetup;
  picks: Picks;
  actualPicks?: Picks;
  teamMap: Record<number, Team>;
}

export default function KnockoutResultsView({ bracketSetup, picks, actualPicks, teamMap }: Props) {
  const totalWidth = ROUND_KEYS.length * CARD_W + (ROUND_KEYS.length - 1) * CONN_W;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex" style={{ width: totalWidth }}>
        {ROUND_KEYS.map((rk, ri) => {
          const { label, count } = ROUND_CONFIG[rk];
          const isLast = ri === ROUND_KEYS.length - 1;

          return (
            <Fragment key={rk}>
              <div className="flex-shrink-0" style={{ width: CARD_W }}>
                <div className="text-center text-xs font-medium text-gray-500 mb-3 whitespace-nowrap truncate px-1">
                  {label}
                </div>
                <div className="relative" style={{ height: TOTAL_H }}>
                  {Array.from({ length: count }, (_, mi) => {
                    const [t1, t2] = getMatchTeams(ri, mi, picks, bracketSetup, teamMap);
                    const userPick = picks[rk][mi];
                    const actualWinner = actualPicks ? (actualPicks[rk][mi] ?? null) : undefined;
                    return (
                      <div key={mi} style={{ position: "absolute", top: cardTop(ri, mi) }}>
                        <ResultMatchCard
                          team1={t1} team2={t2}
                          userPick={userPick ?? null}
                          actualWinner={actualWinner}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

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
                          <div style={{ position: "absolute", left: 0,      top: ya - 0.5, width: hw, height: 1 }} className="bg-gray-200" />
                          <div style={{ position: "absolute", left: 0,      top: yb - 0.5, width: hw, height: 1 }} className="bg-gray-200" />
                          <div style={{ position: "absolute", left: hw - 0.5, top: ya, width: 1, height: yb - ya }} className="bg-gray-200" />
                          <div style={{ position: "absolute", left: hw,     top: ym - 0.5, width: hw, height: 1 }} className="bg-gray-200" />
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
  );
}
