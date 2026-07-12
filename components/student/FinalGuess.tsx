'use client';

import { useState } from 'react';
import type { Room, Team } from '@/lib/localGame';

export function FinalGuess({
  room,
  team,
  onSubmit
}: {
  room: Room;
  team: Team;
  onSubmit: (criminal: string, weapon: string, motive: string) => void;
}) {
  const [criminal, setCriminal] = useState('');
  const [weapon, setWeapon] = useState('');
  const [motive, setMotive] = useState('');

  return (
    <div className="mt-4 space-y-2">
      <select className="w-full rounded-xl bg-black/20 p-2" value={criminal} onChange={(e) => setCriminal(e.target.value)}>
        <option value="">범인</option>
        {room.candidates.criminals.filter((x) => !team.excluded.criminals.includes(x)).map((x) => <option key={x}>{x}</option>)}
      </select>
      <select className="w-full rounded-xl bg-black/20 p-2" value={weapon} onChange={(e) => setWeapon(e.target.value)}>
        <option value="">도구</option>
        {room.candidates.weapons.filter((x) => !team.excluded.weapons.includes(x)).map((x) => <option key={x}>{x}</option>)}
      </select>
      <select className="w-full rounded-xl bg-black/20 p-2" value={motive} onChange={(e) => setMotive(e.target.value)}>
        <option value="">동기</option>
        {room.candidates.motives.filter((x) => !team.excluded.motives.includes(x)).map((x) => <option key={x}>{x}</option>)}
      </select>
      <button
        type="button"
        disabled={!criminal || !weapon || !motive || team.status === 'submitted'}
        onClick={() => onSubmit(criminal, weapon, motive)}
        className="w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg disabled:opacity-40"
      >
        최종 추리 제출
      </button>
    </div>
  );
}
