'use client';

import { useState } from 'react';
import type { Category, Room, Team } from '@/lib/localGame';
import { getCardArt } from '@/lib/cardArt';

function FinalCard({
  category,
  name,
  selected,
  onClick
}: {
  category: Category;
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  const art = getCardArt(category, name);
  const [imageFailed, setImageFailed] = useState(false);

  const fallback =
    category === 'criminals'
      ? '♙'
      : category === 'weapons'
        ? '⚒'
        : '✦';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'relative aspect-[2/3] overflow-hidden rounded-xl border-2 bg-[#f4efe5] text-[#211934] shadow-lg transition',
        selected
          ? '-translate-y-1 border-raven-green ring-4 ring-raven-green/30'
          : 'border-white/25 hover:-translate-y-0.5 hover:border-white/60'
      ].join(' ')}
    >
      <span className="absolute inset-x-0 top-0 h-[76%] overflow-hidden bg-[#ddd3c2]">
        {art && !imageFailed ? (
          <img
            src={art.image}
            alt=""
            draggable={false}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center bg-gradient-to-b from-[#ede4d4] to-[#cbbca4] text-4xl">
            {fallback}
          </span>
        )}
      </span>

      <span className="absolute inset-x-0 bottom-0 grid h-[24%] place-items-center border-t border-black/15 bg-[#f8f3e9] px-1">
        <b className="text-center text-xs leading-tight">{name}</b>
      </span>

      {selected && (
        <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-raven-green text-sm font-black text-raven-bg shadow">
          ✓
        </span>
      )}
    </button>
  );
}

function CardChoiceSection({
  title,
  category,
  cards,
  selected,
  onSelect
}: {
  title: string;
  category: Category;
  cards: string[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-black">{title}</h3>
        <span className="text-xs font-bold text-white/45">
          {selected || '선택 전'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {cards.map((name) => (
          <FinalCard
            key={name}
            category={category}
            name={name}
            selected={selected === name}
            onClick={() => onSelect(name)}
          />
        ))}
      </div>
    </section>
  );
}

export function FinalGuess({
  room,
  team,
  onSubmit
}: {
  room: Room;
  team: Team;
  onSubmit: (
    criminal: string,
    weapon: string,
    motive: string
  ) => void;
}) {
  const [criminal, setCriminal] = useState('');
  const [weapon, setWeapon] = useState('');
  const [motive, setMotive] = useState('');
  const [confirming, setConfirming] = useState(false);

  const criminalCards = room.candidates.criminals.filter(
    (name) => !team.excluded.criminals.includes(name)
  );
  const weaponCards = room.candidates.weapons.filter(
    (name) => !team.excluded.weapons.includes(name)
  );
  const motiveCards = room.candidates.motives.filter(
    (name) => !team.excluded.motives.includes(name)
  );

  const ready = Boolean(criminal && weapon && motive);

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-2xl border border-raven-gold/30 bg-raven-gold/10 p-3 text-center">
        <p className="font-black text-raven-gold">FINAL ROUND</p>
        <p className="mt-1 text-sm text-white/65">
          범인, 도구, 동기 카드를 한 장씩 선택하세요.
        </p>
      </div>

      <CardChoiceSection
        title="범인"
        category="criminals"
        cards={criminalCards}
        selected={criminal}
        onSelect={setCriminal}
      />

      <CardChoiceSection
        title="도구"
        category="weapons"
        cards={weaponCards}
        selected={weapon}
        onSelect={setWeapon}
      />

      <CardChoiceSection
        title="동기"
        category="motives"
        cards={motiveCards}
        selected={motive}
        onSelect={setMotive}
      />

      <button
        type="button"
        disabled={!ready || team.status === 'submitted'}
        onClick={() => setConfirming(true)}
        className="w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg disabled:opacity-40"
      >
        최종 추리 제출
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-6">
          <section className="w-full max-w-lg rounded-3xl border border-raven-gold/40 bg-raven-panel p-7 text-center shadow-2xl">
            <h2 className="text-3xl font-black">최종 추리를 제출할까요?</h2>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-xs font-bold text-white/45">범인</p>
                <p className="mt-1 font-black">{criminal}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-xs font-bold text-white/45">도구</p>
                <p className="mt-1 font-black">{weapon}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-xs font-bold text-white/45">동기</p>
                <p className="mt-1 font-black">{motive}</p>
              </div>
            </div>

            <p className="mt-5 text-sm text-white/55">
              제출 후에는 교사의 판정 전까지 수정할 수 없습니다.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-2xl border border-white/20 p-3 font-black"
              >
                다시 선택
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  onSubmit(criminal, weapon, motive);
                }}
                className="rounded-2xl bg-raven-gold p-3 font-black text-raven-bg"
              >
                제출 확정
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
