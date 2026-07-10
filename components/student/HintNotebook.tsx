import type { Room } from '@/lib/localGame';
import { HintChip } from '@/components/common/HintChip';

export function HintNotebook({ room }: { room: Room }) {
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
