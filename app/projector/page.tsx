'use client';

import { useEffect, useState } from 'react';
import { HintChip } from '@/components/common/HintChip';
import { getSavedTeacherRoomCode, useRemoteRoom } from '@/lib/roomStore';

export default function ProjectorPage() {
  const [code, setCode] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCode((params.get('room') || getSavedTeacherRoomCode()).toUpperCase());
  }, []);

  const { room } = useRemoteRoom(code);
  if (!room) return <main className="grid min-h-screen place-items-center"><h1 className="text-7xl font-black">DYING MESSAGE</h1></main>;

  const teams = Object.values(room.teams);
  const done = teams.filter((team) => ['complete', 'success', 'gameover'].includes(team.status)).length;

  return (
    <main className="flex min-h-screen items-center justify-center p-10 text-center">
      <section className="w-full max-w-6xl">
        <h1 className="text-7xl font-black">DYING MESSAGE</h1>
        <p className="mt-4 text-4xl">ROUND {room.round}</p>
        <p className="mt-3 text-2xl text-white/70">진행 {done} / {teams.length}</p>
        <div className="mt-10 grid grid-cols-3 gap-4 text-left">
          {(['criminal', 'weapon', 'motive'] as const).map((key) => (
            <div key={key} className="rounded-3xl bg-white/10 p-6">
              <h2 className="text-3xl font-black">{key === 'criminal' ? '범인' : key === 'weapon' ? '도구' : '동기'}</h2>
              <div className="mt-4 flex flex-wrap gap-2">{room.hints[key].map((tile) => <HintChip key={tile.id} tile={tile} />)}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
