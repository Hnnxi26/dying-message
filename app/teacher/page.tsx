'use client';

import { QRCodeSVG } from 'qrcode.react';
import { CandidatePanel } from '@/components/teacher/CandidatePanel';
import { HintEditor } from '@/components/teacher/HintEditor';
import { TeamStatusCard } from '@/components/teacher/TeamStatusCard';
import { canNext, createRoom, nextRound, resolveTeam } from '@/lib/localGame';
import { clearRoom, saveRoom, useRoom } from '@/lib/localStore';

export default function TeacherPage() {
  const room = useRoom();
  const studentUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/student?room=${room?.code ?? ''}`;

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
          <p className="mt-5 text-white/60">v0.8 리팩터링 버전</p>
        </section>
      </main>
    );
  }

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
          </article>

          <HintEditor room={room} />
        </section>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="text-2xl font-black">QR 입장</h2>
            <div className="mt-3 w-fit rounded-2xl bg-white p-4">
              <QRCodeSVG value={studentUrl} size={170} />
            </div>
            <p className="mt-3 break-all text-sm text-white/60">{studentUrl}</p>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="text-2xl font-black">조 현황</h2>
            <div className="mt-3 space-y-2">
              {Object.values(room.teams).map((team) => (
                <TeamStatusCard
                  key={team.name}
                  team={team}
                  onJudge={() => {
                    resolveTeam(room, team.name);
                    saveRoom({ ...room });
                  }}
                />
              ))}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
