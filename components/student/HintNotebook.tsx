import type { Room } from '@/lib/localGame';
import { HintChip } from '@/components/common/HintChip';

export function HintNotebook({ room }: { room: Room }) {
  return (
    <section className="rounded-2xl border border-white/15 bg-raven-panel/95 p-4 shadow-xl">
      <div className="grid gap-3 md:grid-cols-3">
        {(['criminal', 'weapon', 'motive'] as const).map((key) => (
          <div key={key} className="rounded-xl border border-white/10 bg-black/15 p-3">
            <b className="text-sm text-purple-200">
              {key === 'criminal' ? '범인 힌트' : key === 'weapon' ? '도구 힌트' : '동기 힌트'}
            </b>
            <div className="mt-2 flex min-h-9 flex-wrap gap-2">
              {room.hints[key].length > 0 ? (
                room.hints[key].map((tile) => <HintChip key={tile.id} tile={tile} />)
              ) : (
                <span className="text-sm text-white/30">공개 전</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
