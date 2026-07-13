'use client';

import { useEffect, useRef, useState } from 'react';
import { CandidateGrid } from '@/components/student/CandidateGrid';
import { HintNotebook } from '@/components/student/HintNotebook';
import { ResultModal, type ResultModalData } from '@/components/student/ResultModal';
import type { Category } from '@/lib/localGame';
import { createTeam, getRoomPhase } from '@/lib/localGame';
import { getRemoteRoom, mutateRoom, useRemoteRoom } from '@/lib/roomStore';

export default function StudentPage() {
  const [roomCode, setRoomCode] = useState('');
  const [verifiedCode, setVerifiedCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [joinedTeamName, setJoinedTeamName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resultModal, setResultModal] = useState<ResultModalData | null>(null);
  const [now, setNow] = useState(Date.now());
  const previousStatusRef = useRef('');
  const { room, loading } = useRemoteRoom(verifiedCode);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = (params.get('room') || '').toUpperCase();
    const savedTeam = localStorage.getItem('teamName') || '';
    const savedCode = localStorage.getItem('verifiedRoomCode') || '';
    const initialCode = codeFromUrl || savedCode;

    setRoomCode(initialCode);
    setTeamName(savedTeam);
    if (initialCode) void verifyCode(initialCode, false);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!room || !joinedTeamName) return;
    const team = room.teams[joinedTeamName];
    if (!team) return;

    const previous = previousStatusRef.current;
    if (previous && previous !== team.status) {
      if (team.status === 'complete') {
        setResultModal({ kind: 'success', title: '제외 성공!', message: `ROUND ${team.round} 완료. 다음 라운드를 기다려 주세요.`, icon: '✅' });
      } else if (team.status === 'retry') {
        setResultModal({ kind: 'failure', title: '제외 실패', message: '정답 카드가 포함되어 추리 타일 1개가 소모되었습니다. 다시 도전하세요.', icon: '💥' });
      } else if (
        previous === 'submitted' &&
        team.status === 'thinking' &&
        team.round === 4
      ) {
        setResultModal({
          kind: 'failure',
          title: '최종 추리 실패',
          message: '추리 타일 1개가 소모되었습니다. 남은 카드를 다시 검토해 최종 추리에 재도전하세요.',
          icon: '🔎'
        });
      } else if (team.status === 'success') {
        setResultModal({ kind: 'final-success', title: '사건 해결!', message: '최종 추리에 성공했습니다!', icon: '🏆' });
      } else if (team.status === 'gameover') {
        setResultModal({ kind: 'gameover', title: 'GAME OVER', message: '남은 추리 타일이 없습니다.', icon: '☠' });
      }
    }
    previousStatusRef.current = team.status;
  }, [room, joinedTeamName]);

  async function verifyCode(value = roomCode, showError = true) {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;

    setBusy(true);
    try {
      const found = await getRemoteRoom(normalized);

      if (!found) {
        if (showError) setError('존재하지 않는 방입니다.');
        return;
      }

      localStorage.setItem('verifiedRoomCode', normalized);
      setVerifiedCode(normalized);
      setRoomCode(normalized);
      setError('');

      const savedTeam = localStorage.getItem('teamName') || '';
      if (savedTeam && found.teams[savedTeam]) {
        setJoinedTeamName(savedTeam);
      }
    } catch (cause) {
      if (showError) {
        setError(
          cause instanceof Error
            ? cause.message
            : '방을 확인하지 못했습니다.'
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (!verifiedCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <p className="mt-2 text-white/60">방 코드를 입력하세요.</p>
          <input
            value={roomCode}
            onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') void verifyCode(); }}
            maxLength={6}
            placeholder="방 코드"
            className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 p-3 text-center text-2xl font-black tracking-[0.3em]"
          />
          {error && <p className="mt-3 rounded-xl bg-red-500/20 p-3 text-center text-red-100">{error}</p>}
          <button type="button" disabled={busy} onClick={() => void verifyCode()} className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg disabled:opacity-50">
            {busy ? '확인 중...' : '방 입장 확인'}
          </button>
        </section>
      </main>
    );
  }

  if (loading || !room) {
    return <main className="grid min-h-screen place-items-center text-2xl font-black">방 연결 중...</main>;
  }

  const team = joinedTeamName ? room.teams[joinedTeamName] : undefined;
  if (team && !previousStatusRef.current) previousStatusRef.current = team.status;

  async function joinTeam() {
    if (!room) return;

    const normalized = teamName.trim();
    if (!normalized || busy) return;

    const savedTeam = localStorage.getItem('teamName') || '';

    setBusy(true);
    setError('');

    try {
      await mutateRoom(room.code, (draft) => {
        const existingTeam = draft.teams[normalized];

        if (existingTeam && savedTeam !== normalized) {
          throw new Error('이미 사용 중인 조 이름입니다.');
        }

        if (!existingTeam) {
          draft.teams[normalized] = createTeam(normalized, draft.round);
        }
      });

      localStorage.setItem('teamName', normalized);
      localStorage.setItem('verifiedRoomCode', room.code);
      setJoinedTeamName(normalized);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '조 입장에 실패했습니다.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (!team) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <div className="rounded-xl bg-raven-gold/15 p-3 text-center text-raven-gold">방 코드 확인 완료: <b>{room.code}</b></div>
          <h1 className="mt-5 text-4xl font-black">조 이름 입력</h1>
          <input
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void joinTeam();
            }}
            placeholder="예: 3조"
            className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 p-3"
          />

          {error && (
            <p className="mt-3 rounded-xl bg-red-500/20 p-3 text-center font-bold text-red-100">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void joinTeam()}
            className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg disabled:opacity-50"
          >
            {busy ? '입장 중...' : '입장하기'}
          </button>
        </section>
      </main>
    );
  }

  const roomPhase = getRoomPhase(room);

  if (roomPhase !== 'playing') {
    const countdownLeft =
      room.countdownEndsAt
        ? Math.max(0, Math.ceil((room.countdownEndsAt - now) / 1000))
        : 0;

    return (
      <main className="grid min-h-screen place-items-center p-8">
        <section className="w-full max-w-2xl rounded-3xl border border-white/15 bg-raven-panel/95 p-10 text-center shadow-2xl">
          {roomPhase === 'countdown' ? (
            <>
              <p className="text-2xl font-black text-raven-gold">
                {room.round === 4 ? 'FINAL ROUND' : `ROUND ${room.round}`}
              </p>
              <div className="mt-5 text-[10rem] font-black leading-none">
                {countdownLeft > 0 ? countdownLeft : 'START'}
              </div>
              <p className="mt-6 text-xl font-bold text-white/70">
                {room.round === 4
                  ? '이번이 마지막 추리입니다. 범인, 도구, 동기를 확정하세요.'
                  : '수사 시작을 준비하세요.'}
              </p>
            </>
          ) : (
            <>
              <div className="text-7xl">🕵️</div>
              <h1 className="mt-5 text-4xl font-black">
                {roomPhase === 'briefing'
                  ? '사건 브리핑이 진행 중입니다.'
                  : '교사의 시작을 기다리는 중입니다.'}
              </h1>
              <p className="mt-5 text-xl font-bold text-white/70">
                프로젝터를 봐 주세요.
              </p>
              <div className="mt-7 flex justify-center gap-3">
                <span className="rounded-full border border-white/20 px-5 py-3 font-black">
                  {team.name}
                </span>
                <span className="rounded-full border border-white/20 px-5 py-3 font-black">
                  방 코드 {room.code}
                </span>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  if (team.status === 'submitted') {
    return (
      <main className="grid min-h-screen place-items-center p-8">
        <section className="w-full max-w-xl rounded-3xl border border-raven-gold/40 bg-raven-panel/95 p-10 text-center shadow-2xl">
          <div className="text-7xl">⏳</div>
          <h1 className="mt-5 text-4xl font-black">제출 완료</h1>
          <p className="mt-4 text-lg font-bold text-white/80">
            교사의 판정을 기다리는 중입니다.
          </p>
          <p className="mt-2 text-sm text-white/50">
            판정 결과는 이 화면에 자동으로 표시됩니다.
          </p>

          <div className="mt-7 rounded-2xl bg-black/20 p-4">
            <div className="flex items-center justify-center gap-3">
              <span className="rounded-full border border-white/20 px-4 py-2 font-black">
                {team.name}
              </span>
              <span className="rounded-full border border-white/20 px-4 py-2 font-black">
                ROUND {team.round}
              </span>
            </div>

            {team.pending?.type === 'exclude' && (
              <div className="mt-5">
                <p className="text-sm font-bold text-white/50">
                  제출한 제외 카드
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {team.pending.cards.map((card) => (
                    <span
                      key={card}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-black"
                    >
                      {card}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {resultModal && (
          <ResultModal
            data={resultModal}
            onClose={() => setResultModal(null)}
          />
        )}
      </main>
    );
  }

  async function toggleCard(card: string) {
    if (!room || !team) return;
    if (['submitted', 'complete', 'gameover', 'success'].includes(team.status)) return;

    await mutateRoom(room.code, (draft) => {
      const current = draft.teams[joinedTeamName];
      if (!current) return;

      if (draft.round === 4) {
        const category = draft.candidates.criminals.includes(card)
          ? 'criminals'
          : draft.candidates.weapons.includes(card)
            ? 'weapons'
            : 'motives';

        const cardsInCategory = draft.candidates[category];
        const withoutCurrentCategory = current.selected.filter(
          (item) => !cardsInCategory.includes(item)
        );

        current.selected = current.selected.includes(card)
          ? withoutCurrentCategory
          : [...withoutCurrentCategory, card];
        return;
      }

      current.selected = current.selected.includes(card)
        ? current.selected.filter((item) => item !== card)
        : current.selected.length >= 6
          ? current.selected
          : [...current.selected, card];
    });
  }

  async function submitExclusion() {
    if (!room || !team) return;
    if (team.selected.length !== 6) return;
    await mutateRoom(room.code, (draft) => {
      const current = draft.teams[joinedTeamName];
      if (!current || current.selected.length !== 6) return;
      current.status = 'submitted';
      current.pending = { type: 'exclude', cards: [...current.selected] };
      current.notice = '제출 완료: 교사 판정을 기다리세요.';
    });
  }

  async function submitFinal() {
    if (!room || !team) return;

    const criminal = team.selected.find((card) =>
      room.candidates.criminals.includes(card)
    );
    const weapon = team.selected.find((card) =>
      room.candidates.weapons.includes(card)
    );
    const motive = team.selected.find((card) =>
      room.candidates.motives.includes(card)
    );

    if (!criminal || !weapon || !motive) return;

    const confirmed = window.confirm(
      `최종 추리를 제출할까요?\n\n범인: ${criminal}\n도구: ${weapon}\n동기: ${motive}`
    );
    if (!confirmed) return;

    await mutateRoom(room.code, (draft) => {
      const current = draft.teams[joinedTeamName];
      if (!current) return;
      current.status = 'submitted';
      current.pending = { type: 'final', criminal, weapon, motive };
      current.notice = '최종 추리 제출 완료';
    });
  }

  const selectedCriminal = team.selected.find((card) =>
    room.candidates.criminals.includes(card)
  );
  const selectedWeapon = team.selected.find((card) =>
    room.candidates.weapons.includes(card)
  );
  const selectedMotive = team.selected.find((card) =>
    room.candidates.motives.includes(card)
  );

  return (
    <>
      <main className="min-h-screen px-4 pb-8">
        <section className="sticky top-0 z-40 -mx-4 border-b border-white/10 bg-raven-bg/95 px-4 pb-4 pt-3 shadow-2xl backdrop-blur">
          <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div>
              <h1 className="text-3xl font-black xl:text-4xl">DYING MESSAGE</h1>
              <p className="text-sm text-white/55">소설가의 마지막 유언</p>
            </div>

            <div className="flex justify-center gap-2">
              <span className="rounded-full border border-white/25 bg-black/20 px-5 py-2 font-black">
                {team.name}
              </span>
              <span className="rounded-full border border-raven-gold/40 bg-raven-gold/10 px-5 py-2 font-black text-raven-gold">
                {room.round === 4 ? 'FINAL ROUND' : `ROUND ${team.round}`}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="rounded-2xl bg-black/20 px-4 py-2 text-sm">
                선택 <b className="text-raven-green">{team.selected.length}</b>/{room.round === 4 ? 3 : 6}
              </div>
              <div className="flex gap-1.5">
                {team.guessTiles.map((alive, index) => (
                  <span
                    key={index}
                    className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-black ${
                      alive ? 'bg-blue-600' : 'bg-red-600'
                    }`}
                  >
                    {alive ? '✓' : '×'}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div className="mt-3 grid grid-cols-[1fr_auto] items-stretch gap-3">
            <HintNotebook room={room} compact />

            <section className="flex min-w-64 flex-col justify-center rounded-2xl border border-white/15 bg-raven-panel/90 p-3">
              {room.round < 4 ? (
                <>
                  <p className="mb-2 text-center text-xs font-bold text-white/45">
                    제외할 카드 6장을 선택하세요.
                  </p>
                  <button
                    type="button"
                    disabled={team.selected.length !== 6 || team.status === 'complete'}
                    onClick={() => void submitExclusion()}
                    className="w-full rounded-xl bg-raven-gold px-5 py-3 font-black text-raven-bg disabled:opacity-40"
                  >
                    제외 제출
                  </button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-black/20 p-2">
                      <span className="block text-white/40">범인</span>
                      <b>{selectedCriminal || '선택 전'}</b>
                    </div>
                    <div className="rounded-xl bg-black/20 p-2">
                      <span className="block text-white/40">도구</span>
                      <b>{selectedWeapon || '선택 전'}</b>
                    </div>
                    <div className="rounded-xl bg-black/20 p-2">
                      <span className="block text-white/40">동기</span>
                      <b>{selectedMotive || '선택 전'}</b>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={team.selected.length !== 3}
                    onClick={() => void submitFinal()}
                    className="mt-2 w-full rounded-xl bg-raven-gold px-5 py-3 font-black text-raven-bg disabled:opacity-40"
                  >
                    최종 추리 제출
                  </button>
                </>
              )}
            </section>
          </div>
        </section>

        {room.round === 4 && (
          <section className="my-4 rounded-3xl border-2 border-raven-gold/60 bg-raven-gold/15 p-4 text-center shadow-lg shadow-raven-gold/10">
            <p className="text-xs font-black tracking-[0.35em] text-raven-gold">FINAL ROUND</p>
            <h2 className="mt-1 text-2xl font-black">이번이 최종 추리입니다.</h2>
            <p className="mt-1 text-sm font-bold text-white/65">남은 카드 중 범인, 도구, 동기를 각각 한 장씩 선택하세요.</p>
          </section>
        )}

        <section className="mt-4 grid gap-4">
          {(['criminals', 'weapons', 'motives'] as Category[]).map((category) => (
            <CandidateGrid
              key={category}
              category={category}
              cards={room.candidates[category]}
              team={team}
              onToggle={(card) => void toggleCard(card)}
            />
          ))}
        </section>
      </main>

      {resultModal && (
        <ResultModal
          data={resultModal}
          onClose={() => setResultModal(null)}
        />
      )}
    </>
  );
}
