'use client';

import { useState } from 'react';
import { createRoom } from '@/lib/game/engine';
import { GameCard } from '@/components/GameCard';
import { HintTile } from '@/components/HintTile';

export default function StudentPage() {
  const [room] = useState(() => createRoom());
  const [teamName, setTeamName] = useState('');
  const [joined, setJoined] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  if (!joined) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <p className="mt-2 text-white/60">조 이름을 입력하세요.</p>
          <input
            className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 px-4 py-3"
            placeholder="예: 3조"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
          />
          <button
            className="mt-4 w-full rounded-2xl bg-raven-gold px-4 py-3 font-black text-raven-bg"
            onClick={() => setJoined(Boolean(teamName.trim()))}
          >
            입장하기
          </button>
        </section>
      </main>
    );
  }

  const toggle = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((item) => item !== name);
      if (prev.length >= 6) return prev;
      return [...prev, name];
    });
  };

  return (
    <main className="min-h-screen p-4">
      <header className="mb-3 grid grid-cols-3 items-center gap-3">
        <div>
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <p className="text-white/60">소설가의 마지막 유언</p>
        </div>
        <div className="flex justify-center gap-3">
          <span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">{teamName}</span>
          <span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">ROUND 1</span>
        </div>
        <div className="justify-self-end rounded-2xl border border-white/15 bg-black/20 px-5 py-3">
          선택 <b className="text-raven-green">{selected.length}</b> / 6
        </div>
      </header>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <section className="grid grid-rows-3 gap-3">
          <Board title="범인" category="criminals" cards={room.candidates.criminals} selected={selected} toggle={toggle} />
          <Board title="실행 도구" category="weapons" cards={room.candidates.weapons} selected={selected} toggle={toggle} />
          <Board title="범행 동기" category="motives" cards={room.candidates.motives} selected={selected} toggle={toggle} />
        </section>

        <aside className="space-y-3">
          <section className="card-paper rounded-3xl p-5 shadow-xl">
            <h2 className="mb-3 text-center text-2xl font-black">공통 힌트</h2>
            <HintBlock title="범인" />
            <HintBlock title="도구" />
            <HintBlock title="동기" />

            <h3 className="mt-4 font-black">공개 타일</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {room.openTiles.slice(0, 12).map((tile) => <HintTile key={tile.id} tile={tile} />)}
            </div>
          </section>

          <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <div className="text-center text-lg">선택한 카드</div>
            <div className="text-center text-5xl font-black text-raven-green">{selected.length} / 6</div>
            <button
              disabled={selected.length !== 6}
              className="mt-4 w-full rounded-2xl bg-raven-gold px-4 py-3 font-black text-raven-bg disabled:opacity-40"
            >
              제외 제출
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Board({
  title,
  category,
  cards,
  selected,
  toggle
}: {
  title: string;
  category: 'criminals' | 'weapons' | 'motives';
  cards: string[];
  selected: string[];
  toggle: (name: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-4">
      <h2 className="mb-3 text-2xl font-black text-purple-200">{title}</h2>
      <div className="grid grid-cols-9 gap-2">
        {cards.map((card) => (
          <GameCard
            key={card}
            name={card}
            category={category}
            selected={selected.includes(card)}
            onClick={() => toggle(card)}
          />
        ))}
      </div>
    </section>
  );
}

function HintBlock({ title }: { title: string }) {
  return (
    <div className="border-b border-black/20 py-3">
      <span className="rounded-xl bg-purple-800 px-3 py-1 font-black text-white">{title}</span>
      <p className="mt-2 text-sm opacity-60">아직 공개 전</p>
    </div>
  );
}
