import type { Room } from '@/lib/localGame';
import { HintChip } from '@/components/common/HintChip';

export function HintNotebook({
  room,
  compact = false
}: {
  room: Room;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <section className="paper rounded-2xl px-4 py-3">
        <div className="flex h-full items-center gap-4">
          <h2 className="shrink-0 text-lg font-black">공통 힌트</h2>

          <div className="grid flex-1 grid-cols-3 gap-3">
            {(['criminal', 'weapon', 'motive'] as const).map((key) => (
              <div
                key={key}
                className="flex min-w-0 items-center gap-2 border-l border-black/15 pl-3"
              >
                <b className="shrink-0 rounded-lg bg-purple-800 px-2 py-1 text-xs text-white">
                  {key === 'criminal' ? '범인' : key === 'weapon' ? '도구' : '동기'}
                </b>
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {room.hints[key].length === 0 ? (
                    <span className="text-xs text-black/40">미공개</span>
                  ) : (
                    room.hints[key].map((tile) => (
                      <HintChip key={tile.id} tile={tile} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="paper rounded-3xl p-5">
      <h2 className="text-center text-2xl font-black">공통 힌트</h2>

      {(['criminal', 'weapon', 'motive'] as const).map((key) => (
        <div key={key} className="border-b border-black/20 py-3">
          <b className="rounded-xl bg-purple-800 px-3 py-1 text-white">
            {key === 'criminal' ? '범인' : key === 'weapon' ? '도구' : '동기'}
          </b>
          <div className="mt-2 flex flex-wrap gap-2">
            {room.hints[key].map((tile) => (
              <HintChip key={tile.id} tile={tile} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
