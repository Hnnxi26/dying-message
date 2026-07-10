'use client';

import { useState } from 'react';
import type { HintTarget, Room, Tile } from '@/lib/localGame';
import { draftTileIds, ensureDraftHints, usedTileIds } from '@/lib/localGame';
import { saveRoom } from '@/lib/localStore';

export type DragPayload =
  | { source: 'pool'; tileId: string }
  | { source: 'draft'; tileId: string; from: HintTarget };

export function useHintDraft(room: Room) {
  const [dragOver, setDragOver] = useState<HintTarget | 'pool' | null>(null);

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
    room.draftHints[from] = room.draftHints[from].filter((tile) => tile.id !== tileId);
  }

  function addDraft(tile: Tile, target: HintTarget) {
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
      const tile = room.draftHints[payload.from].find((item) => item.id === payload.tileId);
      if (!tile) return;
      removeDraft(payload.tileId, payload.from);
      room.draftHints[target].push(tile);
    }

    saveRoom({ ...room });
  }

  function dropBackToPool(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(null);

    const payload = readDragData(event);
    if (!payload || payload.source !== 'draft') return;

    removeDraft(payload.tileId, payload.from);
    saveRoom({ ...room });
  }

  function publishAll() {
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

    const okay = confirm('공개 후에는 수정할 수 없습니다. 학생에게 한 번에 공개할까요?');
    if (!okay) return;

    (['criminal', 'weapon', 'motive'] as HintTarget[]).forEach((key) => {
      room.hints[key].push(...room.draftHints[key]);
    });

    room.draftHints = { criminal: [], weapon: [], motive: [] };
    saveRoom({ ...room });
  }

  const unusedTiles = room.openTiles.filter(
    (tile) => !used.has(tile.id) && !drafted.has(tile.id)
  );

  return {
    dragOver,
    setDragOver,
    draftCount,
    unusedTiles,
    writeDragData,
    dropOnTarget,
    dropBackToPool,
    publishAll
  };
}
