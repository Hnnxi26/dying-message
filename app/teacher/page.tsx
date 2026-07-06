'use client';

import { useMemo, useState } from 'react';
import { createRoom } from '@/lib/game/engine';
import { HintTile } from '@/components/HintTile';

export default function TeacherPage() {
  const [room] = useState(() => createRoom());

  const adjectiveTiles = useMemo(() => room.openTiles.filter((tile) => tile.type === 'adjective'), [room]);
  const nounTiles = useMemo(() => room.openTiles.filter((tile) => tile.type === 'noun'), [room]);

  return (
    <main className="min-h-screen p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>
          <p className="text-white/60">방 코드 {room.code}</p>
        </div>
        <div className="rounded-2xl bg-raven-gold px-5 py-3 font-black text-raven-bg">자동 판정 ON</div>
      </header>

      <div className="grid grid-cols-[1fr_360px] gap-4">
        <section className="space-y-4">
          <article className="rounded-3xl border border-raven-gold/40 bg-raven-gold/10 p-5">
            <h2 className="mb-3 text-2xl font-black">정답 교사용</h2>
            <div className="grid grid-cols-3 gap-3">
              <div><b>범인</b><br />{room.answer.criminal}</div>
              <div><b>도구</b><br />{room.answer.weapon}</div>
              <div><b>동기</b><br />{room.answer.motive}</div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="mb-3 text-2xl font-black">공개 타일</h2>
            <p className="mb-3 text-sm text-white/60">형용사는 빨강, 명사는 파랑입니다. 다음 Sprint에서 dnd-kit 드래그 기능을 연결합니다.</p>

            <h3 className="mb-2 font-black">형용사</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {adjectiveTiles.map((tile) => <HintTile key={tile.id} tile={tile} />)}
            </div>

            <h3 className="mb-2 font-black">명사</h3>
            <div className="flex flex-wrap gap-2">
              {nounTiles.map((tile) => <HintTile key={tile.id} tile={tile} />)}
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="mb-3 text-2xl font-black">공통 힌트 보드</h2>
            <div className="grid grid-cols-3 gap-3">
              {['범인', '도구', '동기'].map((label) => (
                <div key={label} className="min-h-32 rounded-2xl border-2 border-dashed border-white/25 p-4">
                  <b>{label}</b>
                  <p className="mt-4 text-sm text-white/50">Drop Here</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <aside className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
          <h2 className="mb-3 text-2xl font-black">조 현황</h2>
          <p className="text-white/60">Firebase 연결 후 실시간 조 현황이 표시됩니다.</p>
          <div className="mt-4 space-y-2">
            <div className="rounded-2xl bg-white/10 p-3">1조 ROUND 1 대기</div>
            <div className="rounded-2xl bg-white/10 p-3">2조 ROUND 1 대기</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
