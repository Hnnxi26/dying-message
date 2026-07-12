'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CandidatePanel } from '@/components/teacher/CandidatePanel';
import { HintEditor } from '@/components/teacher/HintEditor';
import { TeamStatusCard } from '@/components/teacher/TeamStatusCard';
import { canNext, createRoom, getRoomPhase, nextRound, resolveTeam, startBriefing, startCountdown } from '@/lib/localGame';
import {
  createRemoteRoom,
  deleteRemoteRoom,
  getSavedTeacherRoomCode,
  mutateRoom,
  useRemoteRoom
} from '@/lib/roomStore';
import { firebaseReady } from '@/lib/firebase/client';


function compareTeamNames(
  a: { name: string },
  b: { name: string }
): number {
  return a.name.localeCompare(b.name, 'ko', {
    numeric: true,
    sensitivity: 'base'
  });
}

export default function TeacherPage() {
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);
  const pendingSectionRef = useRef<HTMLElement | null>(null);
  const previousPendingCountRef = useRef(0);
  const { room, loading, error } = useRemoteRoom(roomCode);

  useEffect(() => {
    setRoomCode(getSavedTeacherRoomCode());
  }, []);

  const studentUrl =
    typeof window === 'undefined' || !room
      ? ''
      : `${window.location.origin}/student?room=${room.code}`;

  const currentPhase = room ? getRoomPhase(room) : 'lobby';

  const pendingTeams = useMemo(
    () =>
      room
        ? Object.values(room.teams)
            .filter((team) => Boolean(team.pending))
            .sort(compareTeamNames)
        : [],
    [room]
  );

  const otherTeams = useMemo(
    () =>
      room
        ? Object.values(room.teams)
            .filter((team) => !team.pending)
            .sort(compareTeamNames)
        : [],
    [room]
  );

  useEffect(() => {
    const currentCount = pendingTeams.length;

    if (
      currentCount > previousPendingCountRef.current &&
      pendingSectionRef.current
    ) {
      pendingSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    previousPendingCountRef.current = currentCount;
  }, [pendingTeams.length]);

  async function createNewRoom() {
    setBusy(true);
    try {
      const created = createRoom();
      await createRemoteRoom(created);
      setRoomCode(created.code);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseReady) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-xl rounded-3xl bg-raven-panel/90 p-8">
          Firebase 환경변수가 없습니다. Vercel 환경변수를 확인하세요.
        </section>
      </main>
    );
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-2xl font-black">방 불러오는 중...</main>;
  }

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>
          {error && <p className="mt-4 rounded-xl bg-red-500/20 p-3 text-red-100">{error}</p>}
          <button
            type="button"
            disabled={busy}
            className="mt-6 rounded-2xl bg-raven-gold px-6 py-4 font-black text-raven-bg disabled:opacity-50"
            onClick={createNewRoom}
          >
            {busy ? '방 만드는 중...' : '방 만들기'}
          </button>
          <p className="mt-5 text-white/60">화요일 시연용 실시간 버전</p>
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
            방 코드 {room.code} · ROUND {room.round} · {
              currentPhase === 'lobby'
                ? '입장 대기'
                : currentPhase === 'briefing'
                  ? '사건 브리핑'
                  : currentPhase === 'countdown'
                    ? '시작 카운트다운'
                    : '수사 진행'
            }
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {currentPhase === 'lobby' && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await mutateRoom(room.code, startBriefing);
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-xl bg-purple-500 px-4 py-2 font-black text-white disabled:opacity-50"
            >
              사건 브리핑 시작
            </button>
          )}

          {currentPhase === 'briefing' && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await mutateRoom(room.code, (draft) => startCountdown(draft));
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-xl bg-green-500 px-4 py-2 font-black text-white disabled:opacity-50"
            >
              수사 시작
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              window.open(
                `/projector?room=${encodeURIComponent(room.code)}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
            className="rounded-xl border border-raven-gold/50 bg-raven-gold/10 px-4 py-2 font-black text-raven-gold"
          >
            프로젝터 열기
          </button>

          <button
            type="button"
            className="rounded-xl border px-4 py-2"
            onClick={async () => {
              if (!confirm('현재 방을 삭제하고 초기화할까요?')) return;
              await deleteRemoteRoom(room.code);
              setRoomCode('');
            }}
          >
            초기화
          </button>

          <button
            type="button"
            disabled={!canNext(room) || room.round >= 4 || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await mutateRoom(room.code, (draft) => {
                  nextRound(draft);
                  startCountdown(draft);
                });
              } finally {
                setBusy(false);
              }
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
              <CandidatePanel title="범인 후보 9명" items={room.candidates.criminals} answer={room.answer.criminal} />
              <CandidatePanel title="도구 후보 9개" items={room.candidates.weapons} answer={room.answer.weapon} />
              <CandidatePanel title="동기 후보 9개" items={room.candidates.motives} answer={room.answer.motive} />
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
            <p className="mt-3 text-center text-3xl font-black tracking-widest text-raven-gold">{room.code}</p>
            <p className="mt-2 break-all text-xs text-white/50">{studentUrl}</p>
          </article>

          <section
            ref={pendingSectionRef}
            className={`rounded-3xl border p-5 transition ${
              pendingTeams.length > 0
                ? 'animate-pulse border-raven-gold/60 bg-raven-gold/10'
                : 'border-white/15 bg-raven-panel/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">🔔 판정 대기</h2>
              <span className="rounded-full bg-raven-gold px-3 py-1 text-sm font-black text-raven-bg">
                {pendingTeams.length}
              </span>
            </div>

            {pendingTeams.length === 0 ? (
              <p className="mt-3 text-sm text-white/50">
                아직 제출된 조가 없습니다.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {pendingTeams.map((team) => (
                  <TeamStatusCard
                    key={team.name}
                    team={team}
                    emphasized
                    onJudge={async () => {
                      setBusy(true);
                      try {
                        await mutateRoom(room.code, (draft) =>
                          resolveTeam(draft, team.name)
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="text-2xl font-black">전체 조 현황</h2>

            {Object.values(room.teams).length === 0 ? (
              <p className="mt-3 text-sm text-white/50">
                학생 조의 입장을 기다리고 있습니다.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {otherTeams.map((team) => (
                  <TeamStatusCard
                    key={team.name}
                    team={team}
                    onJudge={async () => {
                      setBusy(true);
                      try {
                        await mutateRoom(room.code, (draft) =>
                          resolveTeam(draft, team.name)
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </article>
        </aside>
      </div>
    </main>
  );
}
