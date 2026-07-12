'use client';

import { useState } from 'react';
import type { HintTarget, Room, Tile } from '@/lib/localGame';
import {
  draftTileIds,
  ensureDraftHints,
  usedTileIds
} from '@/lib/localGame';
import { mutateRoom } from '@/lib/roomStore';

export type DragPayload =
  | { source: 'pool'; tileId: string }
  | { source: 'draft'; tileId: string; from: HintTarget };

export function useHintDraft(room: Room) {
  const [dragOver, setDragOver] = useState<HintTarget | 'pool' | null>(null);
  const [busy, setBusy] = useState(false);

  ensureDraftHints(room);
  const used = usedTileIds(room);
  const drafted = draftTileIds(room);
  const draftCount = Object.values(room.draftHints).flat().length;

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

  async function dropOnTarget(event: React.DragEvent, target: HintTarget) {
    event.preventDefault();
    setDragOver(null);
    const payload = readDragData(event);
    if (!payload || busy) return;

    setBusy(true);
    try {
      await mutateRoom(room.code, (draft) => {
        ensureDraftHints(draft);
        const currentUsed = usedTileIds(draft);
        const currentDrafted = draftTileIds(draft);
        const currentDraftCount = Object.values(draft.draftHints).flat().length;
        const firstPublish = Object.values(draft.hints).flat().length === 0;

        if (payload.source === 'pool') {
          const tile = draft.openTiles.find((item) => item.id === payload.tileId);
          if (!tile || currentUsed.has(tile.id) || currentDrafted.has(tile.id)) return;
          if (!firstPublish && currentDraftCount >= 1) {
            throw new Error('추가 힌트는 한 번에 1개만 공개할 수 있습니다.');
          }
          draft.draftHints[target].push(tile);
          return;
        }

        if (payload.from === target) return;
        const tile = draft.draftHints[payload.from].find(
          (item) => item.id === payload.tileId
        );
        if (!tile) return;
        draft.draftHints[payload.from] = draft.draftHints[payload.from].filter(
          (item) => item.id !== payload.tileId
        );
        draft.draftHints[target].push(tile);
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function dropBackToPool(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(null);
    const payload = readDragData(event);
    if (!payload || payload.source !== 'draft' || busy) return;

    setBusy(true);
    try {
      await mutateRoom(room.code, (draft) => {
        ensureDraftHints(draft);
        draft.draftHints[payload.from] = draft.draftHints[payload.from].filter(
          (item) => item.id !== payload.tileId
        );
      });
    } finally {
      setBusy(false);
    }
  }

  async function publishAll() {
    if (busy) return;
    const currentDraftCount = Object.values(room.draftHints).flat().length;
    const firstPublish = Object.values(room.hints).flat().length === 0;

    if (currentDraftCount === 0) return alert('공개할 힌트가 없습니다.');
    if (!firstPublish && currentDraftCount !== 1) {
      return alert('추가 힌트는 정확히 1개만 공개할 수 있습니다.');
    }
    if (firstPublish && currentDraftCount !== 6) {
      const okay = confirm(
        `처음 힌트는 보통 6개입니다. 현재 ${currentDraftCount}개입니다. 그대로 공개할까요?`
      );
      if (!okay) return;
    }
    if (!confirm('공개 후에는 수정할 수 없습니다. 학생에게 한 번에 공개할까요?')) return;

    setBusy(true);
    try {
      await mutateRoom(room.code, (draft) => {
        ensureDraftHints(draft);
        (['criminal', 'weapon', 'motive'] as HintTarget[]).forEach((key) => {
          draft.hints[key].push(...draft.draftHints[key]);
        });
        draft.draftHints = { criminal: [], weapon: [], motive: [] };
      });
    } finally {
      setBusy(false);
    }
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
    publishAll,
    busy
  };
}
