'use client';

import { useEffect, useRef, useState } from 'react';
import { CandidateGrid } from '@/components/student/CandidateGrid';
import { FinalGuess } from '@/components/student/FinalGuess';
import { HintNotebook } from '@/components/student/HintNotebook';
import { ResultModal, type ResultModalData } from '@/components/student/ResultModal';
import type { Category } from '@/lib/localGame';
import { createTeam } from '@/lib/localGame';
import { getRemoteRoom, mutateRoom, useRemoteRoom } from '@/lib/roomStore';

export default function StudentPage() {
  const [roomCode, setRoomCode] = useState('');
  const [verifiedCode, setVerifiedCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [joinedTeamName, setJoinedTeamName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resultModal, setResultModal] = useState<ResultModalData | null>(null);
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
    if (!room || !joinedTeamName) return;
    const team = room.teams[joinedTeamName];
    if (!team) return;

    const previous = previousStatusRef.current;
    if (previous && previous !== team.status) {
      if (team.status === 'complete') {
        setResultModal({ kind: 'success', title: '제외 성공!', message: `ROUND ${team.round} 완료. 다음 라운드를 기다려 주세요.`, icon: '✅' });
      } else if (team.status === 'retry') {
        setResultModal({ kind: 'failure', title: '제외 실패', message: '정답 카드가 포함되어 추리 타일 1개가 소모되었습니다. 다시 도전하세요.', icon: '💥' });
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

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('teamName');
              localStorage.removeItem('verifiedRoomCode');
              setJoinedTeamName('');
              setVerifiedCode('');
              setTeamName('');
              setRoomCode('');
              setError('');
            }}
            className="mt-3 w-full rounded-xl border border-white/20 p-2 text-sm text-white/60"
          >
            다른 방 또는 조로 입장
          </button>
        </section>
      </main>
    );
  }

  async function toggleCard(card: string) {
    if (!room || !team) return;
    if (['submitted', 'complete', 'gameover', 'success'].includes(team.status)) return;
    await mutateRoom(room.code, (draft) => {
      const current = draft.teams[joinedTeamName];
      if (!current) return;
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

  async function submitFinal(criminal: string, weapon: string, motive: string) {
    if (!room) return;
    await mutateRoom(room.code, (draft) => {
      const current = draft.teams[joinedTeamName];
      if (!current) return;
      current.status = 'submitted';
      current.pending = { type: 'final', criminal, weapon, motive };
      current.notice = '최종 추리 제출 완료';
    });
  }

  return (
    <>
      <main className="min-h-screen p-4">
        <header className="mb-3 grid grid-cols-3 items-center">
          <div><h1 className="text-4xl font-black">DYING MESSAGE</h1><p className="text-white/60">소설가의 마지막 유언</p></div>
          <div className="flex justify-center gap-3"><span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">{team.name}</span><span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">ROUND {team.round}</span></div>
          <div className="justify-self-end rounded-2xl bg-black/20 px-5 py-3">선택 <b className="text-raven-green">{team.selected.length}</b>/6</div>
        </header>

        <div className="grid grid-cols-[1fr_320px] gap-4">
          <section className="grid grid-rows-3 gap-3">
            {(['criminals', 'weapons', 'motives'] as Category[]).map((category) => (
              <CandidateGrid key={category} category={category} cards={room.candidates[category]} team={team} onToggle={(card) => void toggleCard(card)} />
            ))}
          </section>
          <aside className="space-y-3">
            <HintNotebook room={room} />
            <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
              <div className="flex justify-center gap-2">{team.guessTiles.map((alive, index) => <span key={index} className={`grid h-10 w-10 place-items-center rounded-xl ${alive ? 'bg-blue-600' : 'bg-red-600'}`}>{alive ? '✓' : '×'}</span>)}</div>
              {room.round < 4 ? (
                <button type="button" disabled={team.selected.length !== 6 || team.status === 'submitted' || team.status === 'complete'} onClick={() => void submitExclusion()} className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg disabled:opacity-40">제외 제출</button>
              ) : (
                <FinalGuess room={room} team={team} onSubmit={(c, w, m) => void submitFinal(c, w, m)} />
              )}
            </section>
          </aside>
        </div>
      </main>
      {resultModal && <ResultModal data={resultModal} onClose={() => setResultModal(null)} />}
    </>
  );
}
