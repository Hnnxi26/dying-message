import type { CardCategory } from '@/lib/types/game';

const iconMap: Record<CardCategory, string> = {
  criminals: '♙',
  weapons: '⚒',
  motives: '✦'
};

export function GameCard({
  name,
  category,
  selected = false,
  excluded = false,
  onClick
}: {
  name: string;
  category: CardCategory;
  selected?: boolean;
  excluded?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={excluded}
      className={[
        'relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#e7d8bd] text-[#211934] shadow-lg transition',
        selected ? '-translate-y-1 border-raven-green ring-4 ring-raven-green/30' : 'border-white/20',
        excluded ? 'opacity-40 grayscale' : 'hover:-translate-y-1'
      ].join(' ')}
    >
      <span className="text-3xl opacity-70">{iconMap[category]}</span>
      <span className="font-black">{name}</span>
      {excluded && <span className="absolute text-7xl font-black text-black/50">×</span>}
    </button>
  );
}
