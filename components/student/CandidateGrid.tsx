'use client';

import { useEffect, useState } from 'react';
import type { Category, Team } from '@/lib/localGame';
import { getCardArt, getCardBack } from '@/lib/cardArt';

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
  index,
  onClick
}: {
  name: string;
  category: Category;
  selected: boolean;
  excluded: boolean;
  index: number;
  onClick: () => void;
}) {
  const art = getCardArt(category, name);
  const backImage = getCardBack(category);
  const [imageFailed, setImageFailed] = useState(false);
  const [backFailed, setBackFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setRevealed(true),
      Math.min(index * 45, 650)
    );

    return () => window.clearTimeout(timer);
  }, [index]);

  const showFrontImage = Boolean(art && !imageFailed);

  return (
    <button
      type="button"
      disabled={excluded}
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'group relative aspect-[2/3] min-h-36 rounded-2xl outline-none',
        'transition duration-200',
        selected ? '-translate-y-2 scale-[1.025]' : 'hover:-translate-y-1',
        excluded ? 'cursor-not-allowed opacity-35 grayscale' : ''
      ].join(' ')}
      style={{ perspective: '1100px' }}
    >
      <span
        className="absolute inset-0 block transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        <span
          className={[
            'absolute inset-0 overflow-hidden rounded-2xl border-2 shadow-xl',
            category === 'criminals'
              ? 'border-blue-300/45 bg-[#102743]'
              : category === 'weapons'
                ? 'border-lime-300/45 bg-[#243918]'
                : 'border-orange-300/45 bg-[#4a2612]'
          ].join(' ')}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {!backFailed ? (
            <img
              src={backImage}
              alt=""
              draggable={false}
              onError={() => setBackFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]">
              <span className="text-center">
                <b className="block text-sm tracking-[0.18em] text-white/75">
                  DYING MESSAGE
                </b>
                <span className="mt-4 block text-5xl text-white/35">
                  {fallbackIcon[category]}
                </span>
              </span>
            </span>
          )}
        </span>

        <span
          className={[
            'absolute inset-0 overflow-hidden rounded-2xl border-2 bg-[#f4efe5] text-[#211934] shadow-xl',
            selected
              ? 'border-raven-green ring-4 ring-raven-green/35'
              : 'border-white/30 group-hover:border-white/70'
          ].join(' ')}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <span className="absolute inset-x-0 top-0 h-[78%] overflow-hidden bg-[#ddd3c2]">
            {showFrontImage ? (
              <img
                src={art!.image}
                alt=""
                draggable={false}
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.035]"
              />
            ) : (
              <span className="grid h-full place-items-center bg-gradient-to-b from-[#ede4d4] to-[#cbbca4]">
                <span className="text-5xl">{fallbackIcon[category]}</span>
              </span>
            )}
          </span>

          <span className="absolute inset-x-0 bottom-0 grid h-[22%] place-items-center border-t border-black/15 bg-[#f8f3e9] px-2">
            <b className="text-center text-sm leading-tight sm:text-base">
              {name}
            </b>
          </span>

          {selected && (
            <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-raven-green text-sm font-black text-raven-bg shadow-lg">
              ✓
            </span>
          )}

          {excluded && (
            <span className="absolute inset-0 grid place-items-center bg-black/20 text-7xl font-black text-black/55">
              ×
            </span>
          )}
        </span>
      </span>
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-black text-purple-200">{title}</h2>
        <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-bold text-white/45">
          카드를 눌러 선택
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-9">
        {cards.map((card, index) => (
          <CandidateCard
            key={card}
            name={card}
            category={category}
            selected={team.selected.includes(card)}
            excluded={team.excluded[category].includes(card)}
            index={index}
            onClick={() => onToggle(card)}
          />
        ))}
      </div>
    </section>
  );
}
