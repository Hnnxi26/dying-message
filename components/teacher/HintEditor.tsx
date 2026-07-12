'use client';

import type { HintTarget, Room } from '@/lib/localGame';
import { HintChip } from '@/components/common/HintChip';
import { useHintDraft } from '@/hooks/useHintDraft';

const labels: Record<HintTarget, string> = {
  criminal: '범인',
  weapon: '도구',
  motive: '동기'
};

export function HintEditor({ room }: { room: Room }) {
  const {
    dragOver,
    setDragOver,
    draftCount,
    unusedTiles,
    writeDragData,
    dropOnTarget,
    dropBackToPool,
    publishAll,
    busy
  } = useHintDraft(room);

  return (
    <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">힌트 편집</h2>
          <p className="mt-1 text-sm text-white/60">
            타일을 드래그해 임시 배치한 뒤 한 번에 공개합니다.
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
            <HintChip
              key={tile.id}
              tile={tile}
              draggable
              onDragStart={(event) =>
                writeDragData(event, { source: 'pool', tileId: tile.id })
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
                  <HintChip tile={tile} />
                  <span className="absolute -right-1 -top-2 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px]">
                    🔒
                  </span>
                </div>
              ))}

              {room.draftHints[key].map((tile) => (
                <div key={tile.id} className="rounded-xl ring-4 ring-raven-gold/40">
                  <HintChip
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
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={draftCount === 0 || busy}
        onClick={publishAll}
        className="mt-5 w-full rounded-2xl bg-raven-gold px-5 py-4 text-lg font-black text-raven-bg disabled:opacity-40"
      >
        학생에게 한 번에 공개
      </button>
    </article>
  );
}
