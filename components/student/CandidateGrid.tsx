'use client';

import { useState } from 'react';
import type { Category, Team } from '@/lib/localGame';
import { getCardArt } from '@/lib/cardArt';

const fallbackIcon: Record<Category, string> = {
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
  const art = getCardArt(category, name);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(art && !imageFailed);

  return (
    <button
      type="button"
      disabled={excluded}
      onClick={onClick}
      className={[
        'group relative overflow-hidden rounded-2xl border-2 bg-[#f4efe5] text-[#211934] shadow-lg transition',
        'aspect-[3/4] min-h-32',
        selected
          ? '-translate-y-1 border-raven-green ring-4 ring-raven-green/30'
          : 'border-white/25 hover:-translate-y-0.5 hover:border-white/60',
        excluded ? 'opacity-35 grayscale' : ''
      ].join(' ')}
    >
      <div className="absolute inset-x-0 top-0 h-[74%] overflow-hidden bg-[#ddd3c2]">
        {showImage ? (
          <img
            src={art!.image}
            alt=""
            draggable={false}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-b from-[#ede4d4] to-[#cbbca4]">
            <span className="text-5xl">{fallbackIcon[category]}</span>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 grid h-[26%] place-items-center border-t border-black/15 bg-[#f8f3e9] px-1">
        <b className="text-center text-sm leading-tight">{name}</b>
      </div>

      {selected && (
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-raven-green text-sm font-black text-raven-bg shadow">
          ✓
        </span>
      )}

      {excluded && (
        <span className="absolute inset-0 grid place-items-center bg-black/10 text-7xl font-black text-black/50">
          ×
        </span>
      )}
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-black text-purple-200">{title}</h2>
        <span className="text-sm font-bold text-white/45">
          카드를 눌러 선택
        </span>
      </div>

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
