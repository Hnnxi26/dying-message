import type { HintTile as HintTileType } from '@/lib/types/game';

export function HintTile({ tile }: { tile: HintTileType }) {
  const color = tile.type === 'adjective'
    ? 'from-red-400 to-red-700 border-red-200/50'
    : 'from-blue-400 to-blue-800 border-blue-200/50';

  return (
    <span className={`inline-flex rounded-xl border bg-gradient-to-b px-3 py-2 text-sm font-black text-white shadow ${color}`}>
      {tile.word}
    </span>
  );
}
