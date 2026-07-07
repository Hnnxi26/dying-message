'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import {
  HintTarget,
  createRoom,
  canNext,
  nextRound,
  resolveTeam,
  usedTileIds
} from '@/lib/localGame';
import { clearRoom, saveRoom, useRoom } from '@/lib/localStore';

const labels: Record<HintTarget, string> = {
  criminal: '범인',
  weapon: '도구',
  motive: '동기'
};

function Chip({ word, type }: { word: string; type: 'adjective' | 'noun' }) {
  return (
    <span className={`inline-flex rounded-xl px-3 py-2 text-sm font-black text-white ${type === 'adjective' ? 'bg-red-600' : 'bg-blue-600'}`}>
      {word}
    </span>
  );
}

export default function Teacher() {
  const room = useRoom();
  const [target, setTarget] = useState<HintTarget>('criminal');
  const [selected, setSelected] = useState('');
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/student`;

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>
          <button
            type="button"
            className="mt-6 rounded-2xl bg-raven-gold px-6 py-4 font-black text-raven-bg"
            onClick={() => saveRoom(createRoom())}
          >
            방 만들기
          </button>
          <p className="mt-5 text-white/60">v0.6 오프라인 교실 테스트 버전</p>
        </section>
      </main>
    );
  }

  function publish() {
    if (!room) return;
    const tile = room.openTiles.find((item) => item.id === selected);
    if (!tile) return;

    room.hints[target].push(tile);
    setSelected('');
    saveRoom({ ...room });
  }

  function goNextRound() {
    if (!room) return;
    nextRound(room);
    saveRoom({ ...room });
  }

  function judgeTeam(teamName: string) {
    if (!room) return;
    resolveTeam(room, teamName);
    saveRoom({ ...room });
  }

  const used = usedTileIds(room);

  return (
    <main className="min-h-screen p-5">
      <header className="mb-4 flex justify-between">
        <div>
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>
          <p className="text-white/60">
            방 코드 {room.code} · ROUND {room.round}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-xl border px-4 py-2"
            onClick={() => {
              clearRoom();
              location.reload();
            }}
          >
            초기화
          </button>

          <button
            type="button"
            disabled={!canNext(room) || room.round >= 4}
            onClick={goNextRound}
            className="rounded-2xl bg-raven-gold px-5 py-3 font-black text-raven-bg disabled:opacity-40"
          >
            다음 라운드
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_380px] gap-4">
        <section className="space-y-4">
          <article className="rounded-3xl border border-raven-gold/40 bg-raven-gold/10 p-5">
            <h2 className="text-2xl font-black">정답</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>범인<br /><b>{room.answer.criminal}</b></div>
              <div>도구<br /><b>{room.answer.weapon}</b></div>
              <div>동기<br /><b>{room.answer.motive}</b></div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="text-2xl font-black">공통 힌트</h2>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {(Object.keys(labels) as HintTarget[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTarget(key)}
                  className={`rounded-2xl border-2 border-dashed p-4 text-left ${target === key ? 'border-raven-gold bg-raven-gold/10' : 'border-white/20'}`}
                >
                  <b>{labels[key]}</b>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.hints[key].map((tile) => (
                      <Chip key={tile.id} word={tile.word} type={tile.type} />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <h3 className="mt-5 font-black">공개 타일</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {room.openTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  disabled={used.has(tile.id)}
                  onClick={() => setSelected(tile.id)}
                  className={`${selected === tile.id ? 'ring-4 ring-raven-gold' : ''} ${used.has(tile.id) ? 'opacity-30' : ''}`}
                >
                  <Chip word={tile.word} type={tile.type} />
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!selected}
              onClick={publish}
              className="mt-4 rounded-2xl bg-raven-gold px-5 py-3 font-black text-raven-bg disabled:opacity-40"
            >
              선택 타일을 {labels[target]} 힌트로 공개
            </button>
          </article>
        </section>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="text-2xl font-black">QR 입장</h2>
            <div className="mt-3 w-fit rounded-2xl bg-white p-4">
              <QRCodeSVG value={url} size={170} />
            </div>
            <p className="mt-3 break-all text-sm text-white/60">{url}</p>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="text-2xl font-black">조 현황</h2>
            <div className="mt-3 space-y-2">
              {Object.values(room.teams).map((team) => (
                <div key={team.name} className="rounded-2xl bg-white/10 p-3">
                  <div className="flex justify-between">
                    <b>{team.name}</b>
                    <span>{team.status}</span>
                  </div>
                  <p className="text-sm text-white/70">{team.notice}</p>
                  {team.pending && (
                    <button
                      type="button"
                      onClick={() => judgeTeam(team.name)}
                      className="mt-2 rounded-xl bg-raven-gold px-3 py-2 font-black text-raven-bg"
                    >
                      자동 판정
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
