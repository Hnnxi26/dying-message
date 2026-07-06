'use client';

import { Suspense, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import type { GameRoom } from '@/lib/types/game';
import { HintTile } from '@/components/HintTile';

export default function ProjectorPage() {
  return (
    <Suspense fallback={<LoadingProjector />}>
      <ProjectorContent />
    </Suspense>
  );
}

function LoadingProjector() {
  return (
    <main className="flex min-h-screen items-center justify-center text-center">
      <h1 className="text-6xl font-black">DYING MESSAGE</h1>
    </main>
  );
}

function ProjectorContent() {
  const params = useSearchParams();
  const code = params.get('room') ?? '';
  const [room, setRoom] = useState<GameRoom | null>(null);

  useEffect(() => {
    if (!code) return;
    return onSnapshot(doc(db, 'rooms', code), (snap) => {
      if (snap.exists()) setRoom(snap.data() as GameRoom);
    });
  }, [code]);

  if (!room) return <LoadingProjector />;

  const teams = Object.values(room.teams);
  const complete = teams.filter((team) => ['round-complete', 'success', 'game-over'].includes(team.status)).length;

  return (
    <main className="flex min-h-screen items-center justify-center p-10 text-center">
      <section className="w-full max-w-5xl">
        <h1 className="text-7xl font-black">DYING MESSAGE</h1>
        <p className="mt-4 text-4xl">ROUND {room.globalRound}</p>
        <p className="mt-4 text-2xl text-white/70">진행 {complete} / {teams.length}</p>
        <div className="mt-10 grid grid-cols-3 gap-4 text-left">
          <Group title="범인" tiles={room.hints.criminal} />
          <Group title="도구" tiles={room.hints.weapon} />
          <Group title="동기" tiles={room.hints.motive} />
        </div>
      </section>
    </main>
  );
}

function Group({ title, tiles }: { title: string; tiles: { id: string; word: string; type: 'adjective' | 'noun' }[] }) {
  return (
    <div className="rounded-3xl bg-white/10 p-6">
      <h2 className="text-3xl font-black">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {tiles.map((tile) => <HintTile key={tile.id} tile={tile} />)}
      </div>
    </div>
  );
}
