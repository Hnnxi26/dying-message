import type { Category, Team } from '@/lib/localGame';

const icon: Record<Category, string> = {
  criminals: '♙',
  weapons: '⚒',
  motives: '✦'
};

function CandidateCard({
  name,
  category,
  selected,
  excluded,
  onClick
}: {
  name: string;
  category: Category;
  selected: boolean;
  excluded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={excluded}
      onClick={onClick}
      className={[
        'relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#e7d8bd] text-[#211934] shadow transition',
        selected ? '-translate-y-1 border-raven-green ring-4 ring-raven-green/30' : 'border-white/20',
        excluded ? 'opacity-40 grayscale' : ''
      ].join(' ')}
    >
      <span className="text-3xl">{icon[category]}</span>
      <b>{name}</b>
      {excluded && <span className="absolute text-7xl font-black text-black/50">×</span>}
    </button>
  );
}

export function CandidateGrid({
  category,
  cards,
  team,
  onToggle
}: {
  category: Category;
  cards: string[];
  team: Team;
  onToggle: (card: string) => void;
}) {
  const title =
    category === 'criminals'
      ? '범인'
      : category === 'weapons'
        ? '실행 도구'
        : '범행 동기';

  return (
    <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-4">
      <h2 className="mb-3 text-2xl font-black text-purple-200">{title}</h2>
      <div className="grid grid-cols-9 gap-2">
        {cards.map((card) => (
          <CandidateCard
            key={card}
            name={card}
            category={category}
            selected={team.selected.includes(card)}
            excluded={team.excluded[category].includes(card)}
            onClick={() => onToggle(card)}
          />
        ))}
      </div>
    </section>
  );
}
