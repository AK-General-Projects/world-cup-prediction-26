type Team = { id: number; name: string; flagCode: string };

interface Props {
  groups: Record<string, Team[]>;
  // teamId → actual position (empty = no results entered yet)
  actualStandings: Record<number, number>;
}

export default function GroupStandingsView({ groups, actualStandings }: Props) {
  const hasActuals = Object.keys(actualStandings).length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.keys(groups).sort().map((letter) => (
        <div key={letter} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Group {letter}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {groups[letter].map((team, index) => {
              const actualPos = actualStandings[team.id];
              const isCorrect = hasActuals && actualPos === index + 1;
              const isWrong = hasActuals && actualPos !== undefined && actualPos !== index + 1;

              return (
                <div
                  key={team.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    isCorrect ? "bg-green-50" : isWrong ? "bg-red-50" : ""
                  }`}
                >
                  <span className="w-4 text-center text-xs font-bold text-gray-400">{index + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/24x18/${team.flagCode}.png`}
                    width={24} height={18} alt={team.name}
                    className="rounded-sm flex-shrink-0"
                  />
                  <span className="text-sm text-gray-800 flex-1">{team.name}</span>
                  {isCorrect && <span className="text-green-500 text-xs">✓</span>}
                  {isWrong && <span className="text-red-400 text-xs">✗</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
