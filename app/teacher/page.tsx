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


const statusView: Record<
  string,
  { label: string; icon: string; box: string; text: string }
> = {
  thinking: {
    label: '생각 중',
    icon: '🟡',
    box: 'border-yellow-300/30 bg-yellow-400/10',
    text: 'text-yellow-100'
  },
  submitted: {
    label: '제출 완료',
    icon: '🟢',
    box: 'border-green-300/30 bg-green-400/10',
    text: 'text-green-100'
  },
  complete: {
    label: '라운드 완료',
    icon: '🔵',
    box: 'border-blue-300/30 bg-blue-400/10',
    text: 'text-blue-100'
  },
  retry: {
    label: '재도전',
    icon: '🔴',
    box: 'border-red-300/30 bg-red-400/10',
    text: 'text-red-100'
  },
  success: {
    label: '사건 해결',
    icon: '⭐',
    box: 'border-raven-gold/40 bg-raven-gold/10',
    text: 'text-raven-gold'
  },
  gameover: {
    label: 'GAME OVER',
    icon: '☠',
    box: 'border-white/20 bg-black/30',
    text: 'text-white/70'
  }
};

function StatusBadge({ status }: { status: string }) {
  const view = statusView[status] ?? statusView.thinking;

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${view.box} ${view.text}`}>
      {view.icon} {view.label}
    </span>
  );
}

function SubmittedCards({ cards }: { cards: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-bold text-white/50">제출한 제외 카드</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {cards.map((card) => (
          <span
            key={card}
            className="rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-xs font-bold"
          >
            {card}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Teacher() {
  const room = useRoom();
  const [dragOver, setDragOver] = useState<HintTarget | 'pool' | null>(null);
  const [judgeResult, setJudgeResult] = useState<{
    teamName: string;
    success: boolean;
    message: string;
  } | null>(null);
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/student?room=${room?.code ?? ''}`;

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
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-lg">{team.name}</b>
                    <StatusBadge status={team.status} />
                  </div>

                  <p className="mt-2 text-sm text-white/70">{team.notice}</p>
                  <div className="mt-2 flex gap-1">
                    {team.guessTiles.map((alive, index) => (
                      <span
                        key={index}
                        className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${
                          alive ? 'bg-blue-600' : 'bg-red-600'
                        }`}
                      >
                        {alive ? '✓' : '×'}
                      </span>
                    ))}
                  </div>

                  {team.pending?.type === 'exclude' && (
                    <>
                      <SubmittedCards cards={team.pending.cards} />
                      <button
                        type="button"
                        onClick={() => {
                          const containsAnswer = team.pending?.type === 'exclude'
                            ? team.pending.cards.some((card) =>
                                [
                                  room.answer.criminal,
                                  room.answer.weapon,
                                  room.answer.motive
                                ].includes(card)
                              )
                            : false;

                          resolveTeam(room, team.name);
                          saveRoom({ ...room });

                          setJudgeResult({
                            teamName: team.name,
                            success: !containsAnswer,
                            message: containsAnswer
                              ? '정답 카드가 포함되어 추리 타일 1개가 소모되었습니다.'
                              : `ROUND ${team.round} 제외에 성공했습니다.`
                          });
                        }}
                        className="mt-3 w-full rounded-xl bg-raven-gold px-3 py-2 font-black text-raven-bg"
                      >
                        판정하기
                      </button>
                    </>
                  )}

                  {team.pending?.type === 'final' && (
                    <button
                      type="button"
                      onClick={() => {
                        const finalSuccess =
                          team.pending?.type === 'final' &&
                          team.pending.criminal === room.answer.criminal &&
                          team.pending.weapon === room.answer.weapon &&
                          team.pending.motive === room.answer.motive;

                        resolveTeam(room, team.name);
                        saveRoom({ ...room });

                        setJudgeResult({
                          teamName: team.name,
                          success: Boolean(finalSuccess),
                          message: finalSuccess
                            ? '최종 추리에 성공해 사건을 해결했습니다.'
                            : '최종 추리에 실패해 추리 타일 1개가 소모되었습니다.'
                        });
                      }}
                      className="mt-3 w-full rounded-xl bg-raven-gold px-3 py-2 font-black text-raven-bg"
                    >
                      최종 추리 판정
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    
      {judgeResult && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6">
          <section
            className={`w-full max-w-md rounded-3xl border p-7 text-center shadow-2xl ${
              judgeResult.success
                ? 'border-green-300/50 bg-[#173a28]'
                : 'border-red-300/50 bg-[#471f2a]'
            }`}
          >
            <div className="text-6xl">
              {judgeResult.success ? '✅' : '❌'}
            </div>
            <h2 className="mt-4 text-3xl font-black">
              {judgeResult.teamName}
            </h2>
            <p className="mt-3 text-lg font-bold">
              {judgeResult.message}
            </p>
            <button
              type="button"
              onClick={() => setJudgeResult(null)}
              className="mt-6 w-full rounded-2xl bg-white px-5 py-3 font-black text-black"
            >
              확인
            </button>
          </section>
        </div>
      )}
</main>
  );
}
