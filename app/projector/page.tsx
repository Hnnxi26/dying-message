'use client';

import { useEffect, useMemo, useState } from 'react';
import { HintChip } from '@/components/common/HintChip';
import {
  getRemoteRoom,
  getSavedTeacherRoomCode,
  useRemoteRoom
} from '@/lib/roomStore';
import { getRoomPhase } from '@/lib/localGame';

const statusView: Record<
  string,
  { label: string; icon: string; cls: string }
> = {
  thinking: {
    label: '추리 중',
    icon: '🟡',
    cls: 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100'
  },
  submitted: {
    label: '판정 대기',
    icon: '🟢',
    cls: 'border-green-300/30 bg-green-400/10 text-green-100'
  },
  complete: {
    label: '라운드 완료',
    icon: '🔵',
    cls: 'border-blue-300/30 bg-blue-400/10 text-blue-100'
  },
  retry: {
    label: '재도전',
    icon: '🔴',
    cls: 'border-red-300/30 bg-red-400/10 text-red-100'
  },
  success: {
    label: '사건 해결',
    icon: '⭐',
    cls: 'border-raven-gold/40 bg-raven-gold/10 text-raven-gold'
  },
  gameover: {
    label: 'GAME OVER',
    icon: '☠',
    cls: 'border-white/20 bg-black/30 text-white/70'
  }
};

function TeamCard({
  name,
  status
}: {
  name: string;
  status: string;
}) {
  const view = statusView[status] ?? statusView.thinking;

  return (
    <div className={`rounded-2xl border p-4 ${view.cls}`}>
      <div className="flex items-center justify-between gap-3">
        <b className="truncate text-2xl">{name}</b>
        <span className="whitespace-nowrap text-lg font-black">
          {view.icon} {view.label}
        </span>
      </div>
    </div>
  );
}


function compareTeamNames(
  a: { name: string },
  b: { name: string }
): number {
  return a.name.localeCompare(b.name, 'ko', {
    numeric: true,
    sensitivity: 'base'
  });
}

export default function ProjectorPage() {
  const [code, setCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [entryError, setEntryError] = useState('');
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCode = (
      params.get('room') ||
      getSavedTeacherRoomCode() ||
      ''
    ).toUpperCase();

    setCode(initialCode);
    setInputCode(initialCode);
  }, []);

  const { room, loading, error } = useRemoteRoom(code);

  const teams = useMemo(
    () =>
      room
        ? Object.values(room.teams).sort(compareTeamNames)
        : [],
    [room]
  );

  const completedCount = teams.filter((team) =>
    ['complete', 'success', 'gameover'].includes(team.status)
  ).length;

  const submittedCount = teams.filter(
    (team) => team.status === 'submitted'
  ).length;

  async function enterRoom() {
    const normalized = inputCode.trim().toUpperCase();

    if (!normalized) {
      setEntryError('방 코드를 입력하세요.');
      return;
    }

    setChecking(true);
    setEntryError('');

    try {
      const found = await getRemoteRoom(normalized);

      if (!found) {
        setEntryError('존재하지 않는 방입니다.');
        return;
      }

      setCode(normalized);
      const url = new URL(window.location.href);
      url.searchParams.set('room', normalized);
      window.history.replaceState({}, '', url);
    } catch (cause) {
      setEntryError(
        cause instanceof Error
          ? cause.message
          : '방 정보를 확인하지 못했습니다.'
      );
    } finally {
      setChecking(false);
    }
  }

  if (!code || (!loading && !room)) {
    return (
      <main className="grid min-h-screen place-items-center p-8">
        <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-raven-panel/95 p-9 text-center">
          <h1 className="text-6xl font-black">DYING MESSAGE</h1>
          <p className="mt-3 text-xl text-white/60">프로젝터 화면</p>

          {error && (
            <p className="mt-5 rounded-xl bg-red-500/20 p-3 text-red-100">
              {error}
            </p>
          )}

          <input
            value={inputCode}
            onChange={(event) => {
              setInputCode(event.target.value.toUpperCase());
              setEntryError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void enterRoom();
            }}
            placeholder="방 코드"
            maxLength={6}
            className="mt-7 w-full rounded-2xl border border-white/20 bg-black/20 p-4 text-center text-3xl font-black tracking-[0.3em]"
          />

          {entryError && (
            <p className="mt-3 rounded-xl bg-red-500/20 p-3 font-bold text-red-100">
              {entryError}
            </p>
          )}

          <button
            type="button"
            disabled={checking}
            onClick={() => void enterRoom()}
            className="mt-4 w-full rounded-2xl bg-raven-gold p-4 text-xl font-black text-raven-bg disabled:opacity-50"
          >
            {checking ? '방 확인 중...' : '프로젝터 시작'}
          </button>
        </section>
      </main>
    );
  }

  if (loading || !room) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="text-center">
          <h1 className="text-7xl font-black">DYING MESSAGE</h1>
          <p className="mt-5 text-2xl text-white/60">방 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  const roomPhase = getRoomPhase(room);

  if (roomPhase === 'briefing') {
    const caseFile = room.caseFile ?? {
      number: '001',
      title: '죽어가는 소설가',
      briefing: [
        '유명 소설가가 자신의 서재에서 숨진 채 발견되었습니다.',
        '현장에는 정체를 알 수 없는 메모가 남아 있습니다.',
        '범인은 거짓 단서를 흘리고 있습니다.',
        '여러분은 형사입니다.',
        '사건을 해결하십시오.'
      ]
    };

    return (
      <main className="grid min-h-screen place-items-center p-10">
        <section className="w-full max-w-6xl rounded-[2.5rem] border border-raven-gold/40 bg-raven-panel/95 p-12 text-center shadow-2xl">
          <p className="text-2xl font-black tracking-[0.4em] text-raven-gold">
            CASE FILE #{caseFile.number}
          </p>
          <h1 className="mt-6 text-7xl font-black">{caseFile.title}</h1>

          <div className="mx-auto mt-10 max-w-4xl space-y-5 rounded-3xl border border-white/10 bg-black/20 p-10">
            {caseFile.briefing.map((line, index) => (
              <p
                key={`${line}-${index}`}
                className={`font-bold ${
                  index >= caseFile.briefing.length - 2
                    ? 'text-4xl text-raven-gold'
                    : 'text-3xl text-white/90'
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          <p className="mt-10 text-2xl font-bold text-white/50">
            교사의 안내에 집중해 주세요.
          </p>
        </section>
      </main>
    );
  }

  if (roomPhase === 'countdown') {
    const left = room.countdownEndsAt
      ? Math.max(0, Math.ceil((room.countdownEndsAt - now) / 1000))
      : 0;

    return (
      <main className="grid min-h-screen place-items-center">
        <section className="text-center">
          <p className="text-5xl font-black text-raven-gold">
            ROUND {room.round}
          </p>
          <div className="mt-8 text-[16rem] font-black leading-none">
            {left > 0 ? left : 'START'}
          </div>
          <p className="mt-8 text-3xl font-bold text-white/60">
            수사를 시작합니다.
          </p>
        </section>
      </main>
    );
  }

  if (roomPhase === 'lobby') {
    return (
      <main className="grid min-h-screen place-items-center p-10">
        <section className="w-full max-w-5xl rounded-3xl border border-white/15 bg-raven-panel/95 p-10 text-center">
          <h1 className="text-7xl font-black">DYING MESSAGE</h1>
          <p className="mt-4 text-3xl font-black text-raven-gold">
            방 코드 {room.code}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {teams.length === 0 ? (
              <div className="col-span-2 rounded-3xl bg-black/20 p-12">
                <div className="text-7xl">📱</div>
                <p className="mt-5 text-3xl font-black">
                  학생 조의 입장을 기다리는 중입니다.
                </p>
              </div>
            ) : (
              teams.map((team) => (
                <div
                  key={team.name}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 text-3xl font-black"
                >
                  ✅ {team.name}
                </div>
              ))
            )}
          </div>
          <p className="mt-8 text-2xl text-white/50">
            모든 조가 입장하면 사건 브리핑을 시작합니다.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <header className="grid grid-cols-3 items-center rounded-3xl border border-white/15 bg-raven-panel/90 px-8 py-6">
        <div>
          <h1 className="text-5xl font-black">DYING MESSAGE</h1>
          <p className="mt-2 text-lg text-white/50">방 코드 {room.code}</p>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-white/50">현재 라운드</p>
          <p className="mt-1 text-6xl font-black text-raven-gold">
            ROUND {room.round}
          </p>
        </div>

        <div className="justify-self-end text-right">
          <p className="text-lg font-bold text-white/50">전체 진행</p>
          <p className="mt-1 text-4xl font-black">
            {completedCount} / {teams.length}
          </p>
          {submittedCount > 0 && (
            <p className="mt-2 text-xl font-black text-green-300">
              🔔 판정 대기 {submittedCount}조
            </p>
          )}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-[1.2fr_1fr] gap-6">
        <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black">조별 진행 상황</h2>
            <span className="rounded-full bg-black/20 px-4 py-2 text-lg font-bold">
              참가 {teams.length}조
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="grid min-h-[430px] place-items-center text-center">
              <div>
                <div className="text-7xl">📱</div>
                <p className="mt-5 text-3xl font-black">
                  학생 조의 입장을 기다리는 중입니다.
                </p>
                <p className="mt-3 text-xl text-white/50">
                  방 코드 {room.code}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {teams.map((team) => (
                <TeamCard
                  key={team.name}
                  name={team.name}
                  status={team.status}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-6">
          <h2 className="text-3xl font-black">공개된 힌트</h2>

          <div className="mt-5 space-y-5">
            {(['criminal', 'weapon', 'motive'] as const).map((key) => {
              const title =
                key === 'criminal'
                  ? '범인'
                  : key === 'weapon'
                    ? '도구'
                    : '동기';

              return (
                <div
                  key={key}
                  className="min-h-36 rounded-2xl border border-white/10 bg-black/15 p-5"
                >
                  <h3 className="text-2xl font-black">{title} 힌트</h3>

                  {room.hints[key].length === 0 ? (
                    <p className="mt-5 text-xl text-white/35">
                      아직 공개된 힌트가 없습니다.
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {room.hints[key].map((tile) => (
                        <HintChip key={tile.id} tile={tile} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-6 py-4 text-center text-xl font-bold text-white/60">
        {submittedCount > 0
          ? `교사가 ${submittedCount}개 조의 제출을 판정하고 있습니다.`
          : completedCount === teams.length && teams.length > 0 && room.round < 4
            ? '모든 조가 라운드를 마쳤습니다. 다음 라운드를 기다려 주세요.'
            : room.round === 4
              ? '최종 추리가 진행 중입니다.'
              : '각 조는 공개된 힌트를 바탕으로 추리를 진행하세요.'}
      </footer>
    </main>
  );
}
