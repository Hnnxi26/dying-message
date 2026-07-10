import type { Tile } from '@/lib/localGame';

export function HintChip({
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
