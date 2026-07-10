'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import {
  HintTarget,
  Tile,
  canNext,
  createRoom,
  draftTileIds,
  ensureDraftHints,
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

type DragPayload =
  | { source: 'pool'; tileId: string }
  | { source: 'draft'; tileId: string; from: HintTarget };

function Chip({
  tile,
  draggable = false,
  onDragStart
}: {
  tile: Tile;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={[
        'inline-flex select-none rounded-xl px-3 py-2 text-sm font-black text-white shadow',
        draggable ? 'cursor-grab active:cursor-grabbing' : '',
        tile.type === 'adjective' ? 'bg-red-600' : 'bg-blue-600'
      ].join(' ')}
    >
      {tile.word}
    </div>
  );
}

function CandidatePanel({
  title,
  items,
  answer
}: {
  title: string;
  items: string[];
  answer: string;
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black/15 p-4">
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item}
            className={`rounded-xl px-3 py-2 text-center text-sm font-bold ${
              item === answer
                ? 'border border-raven-gold bg-raven-gold/20 text-raven-gold'
                : 'bg-white/10'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Teacher() {
  const room = useRoom();
  const [dragOver, setDragOver] = useState<HintTarget | 'pool' | null>(null);
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
          <p className="mt-5 text-white/60">v0.6.1 힌트 UX 개선판</p>
        </section>
      </main>
    );
  }

  ensureDraftHints(room);

  const used = usedTileIds(room);
  const drafted = draftTileIds(room);
  const publishedCount = Object.values(room.hints).flat().length;
  const draftCount = Object.values(room.draftHints).flat().length;
  const firstPublish = publishedCount === 0;

  function writeDragData(event: React.DragEvent, payload: DragPayload) {
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  }

  function readDragData(event: React.DragEvent): DragPayload | null {
    try {
      return JSON.parse(event.dataTransfer.getData('application/json')) as DragPayload;
    } catch {
      return null;
    }
  }

  function removeDraft(tileId: string, from: HintTarget) {
    if (!room) return;
    room.draftHints[from] = room.draftHints[from].filter((tile) => tile.id !== tileId);
  }

  function addDraft(tile: Tile, target: HintTarget) {
    if (!room) return;

    const currentUsed = usedTileIds(room);
    const currentDrafted = draftTileIds(room);
    const currentDraftCount = Object.values(room.draftHints).flat().length;
    const isFirstPublish = Object.values(room.hints).flat().length === 0;

    if (currentUsed.has(tile.id) || currentDrafted.has(tile.id)) return;

    if (!isFirstPublish && currentDraftCount >= 1) {
      alert('추가 힌트는 한 번에 1개만 공개할 수 있습니다.');
      return;
    }

    room.draftHints[target].push(tile);
  }

  function dropOnTarget(event: React.DragEvent, target: HintTarget) {
    if (!room) return;

    event.preventDefault();
    setDragOver(null);

    const payload = readDragData(event);
    if (!payload) return;

    if (payload.source === 'pool') {
      const tile = room.openTiles.find((item) => item.id === payload.tileId);
      if (!tile) return;
      addDraft(tile, target);
    } else {
      if (payload.from === target) return;

      const tile = room.draftHints[payload.from].find(
        (item) => item.id === payload.tileId
      );
      if (!tile) return;

      removeDraft(payload.tileId, payload.from);
      room.draftHints[target].push(tile);
    }

    saveRoom({ ...room });
  }

  function dropBackToPool(event: React.DragEvent) {
    if (!room) return;

    event.preventDefault();
    setDragOver(null);

    const payload = readDragData(event);
    if (!payload || payload.source !== 'draft') return;

    removeDraft(payload.tileId, payload.from);
    saveRoom({ ...room });
  }

  function publishAll() {
    if (!room) return;

    const currentDraftCount = Object.values(room.draftHints).flat().length;
    const isFirstPublish = Object.values(room.hints).flat().length === 0;

    if (currentDraftCount === 0) {
      alert('공개할 힌트가 없습니다.');
      return;
    }

    if (!isFirstPublish && currentDraftCount !== 1) {
      alert('추가 힌트는 정확히 1개만 공개할 수 있습니다.');
      return;
    }

    if (isFirstPublish && currentDraftCount !== 6) {
      const okay = confirm(
        `처음 힌트는 보통 6개입니다. 현재 ${currentDraftCount}개입니다. 그대로 공개할까요?`
      );
      if (!okay) return;
    }

    const okay = confirm(
      '공개 후에는 수정할 수 없습니다. 학생에게 한 번에 공개할까요?'
    );
    if (!okay) return;

    (Object.keys(labels) as HintTarget[]).forEach((key) => {
      room.hints[key].push(...room.draftHints[key]);
    });

    room.draftHints = {
      criminal: [],
      weapon: [],
      motive: []
    };

    saveRoom({ ...room });
  }

  const unusedTiles = room.openTiles.filter(
    (tile) => !used.has(tile.id) && !drafted.has(tile.id)
  );

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
            onClick={() => {
              nextRound(room);
              saveRoom({ ...room });
            }}
            className="rounded-2xl bg-raven-gold px-5 py-3 font-black text-raven-bg disabled:opacity-40"
          >
            다음 라운드
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_380px] gap-4">
        <section className="space-y-4">
          <article className="rounded-3xl border border-raven-gold/40 bg-raven-gold/10 p-5">
            <h2 className="text-2xl font-black">정답 및 후보 카드</h2>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <CandidatePanel
                title="범인 후보 9명"
                items={room.candidates.criminals}
                answer={room.answer.criminal}
              />
              <CandidatePanel
                title="도구 후보 9개"
                items={room.candidates.weapons}
                answer={room.answer.weapon}
              />
              <CandidatePanel
                title="동기 후보 9개"
                items={room.candidates.motives}
                answer={room.answer.motive}
              />
            </div>

            <p className="mt-3 text-sm text-white/60">
              노란색 테두리가 정답입니다. 교사 화면에만 표시됩니다.
            </p>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">힌트 편집</h2>
                <p className="mt-1 text-sm text-white/60">
                  타일을 드래그해 임시 배치하고, 공개 버튼을 누르면 학생에게 한 번에 공개됩니다.
                </p>
              </div>

              <div className="rounded-xl bg-black/20 px-3 py-2 text-sm">
                임시 배치 {draftCount}개
              </div>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver('pool');
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={dropBackToPool}
              className={`mt-5 rounded-2xl border-2 border-dashed p-4 transition ${
                dragOver === 'pool'
                  ? 'border-raven-gold bg-raven-gold/10'
                  : 'border-white/20'
              }`}
            >
              <h3 className="font-black">공개 타일 보드</h3>
              <p className="mt-1 text-xs text-white/50">
                임시 힌트를 이 영역으로 다시 드롭하면 취소됩니다.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {unusedTiles.map((tile) => (
                  <Chip
                    key={tile.id}
                    tile={tile}
                    draggable
                    onDragStart={(event) =>
                      writeDragData(event, {
                        source: 'pool',
                        tileId: tile.id
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {(Object.keys(labels) as HintTarget[]).map((key) => (
                <div
                  key={key}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(key);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(event) => dropOnTarget(event, key)}
                  className={`min-h-40 rounded-2xl border-2 border-dashed p-4 transition ${
                    dragOver === key
                      ? 'border-raven-gold bg-raven-gold/10'
                      : 'border-white/20'
                  }`}
                >
                  <h3 className="font-black">{labels[key]} 힌트</h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.hints[key].map((tile) => (
                      <div key={tile.id} className="relative">
                        <Chip tile={tile} />
                        <span className="absolute -right-1 -top-2 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px]">
                          🔒
                        </span>
                      </div>
                    ))}

                    {room.draftHints[key].map((tile) => (
                      <div
                        key={tile.id}
                        className="rounded-xl ring-4 ring-raven-gold/40"
                      >
                        <Chip
                          tile={tile}
                          draggable
                          onDragStart={(event) =>
                            writeDragData(event, {
                              source: 'draft',
                              tileId: tile.id,
                              from: key
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-white/50">여기로 드롭</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={draftCount === 0}
              onClick={publishAll}
              className="mt-5 w-full rounded-2xl bg-raven-gold px-5 py-4 text-lg font-black text-raven-bg disabled:opacity-40"
            >
              학생에게 한 번에 공개
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
                      onClick={() => {
                        resolveTeam(room, team.name);
                        saveRoom({ ...room });
                      }}
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
