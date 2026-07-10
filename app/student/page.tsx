'use client';

import { useEffect, useRef, useState } from 'react';
import { CandidateGrid } from '@/components/student/CandidateGrid';
import { HintNotebook } from '@/components/student/HintNotebook';
import { ResultModal, type ResultModalData } from '@/components/student/ResultModal';
import type { Category, Room, Team } from '@/lib/localGame';
import { createTeam } from '@/lib/localGame';
import { saveRoom, useRoom } from '@/lib/localStore';

export default function StudentPage() {
  const room = useRoom();
  const [roomCode, setRoomCode] = useState('');
  const [roomVerified, setRoomVerified] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [joinedTeamName, setJoinedTeamName] = useState('');
  const [error, setError] = useState('');
  const [resultModal, setResultModal] = useState<ResultModalData | null>(null);
  const previousStatusRef = useRef('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = (params.get('room') || '').toUpperCase();
    const savedTeamName = localStorage.getItem('teamName') || '';
    const savedRoomCode = localStorage.getItem('verifiedRoomCode') || '';

    setRoomCode(codeFromUrl || savedRoomCode);
    setTeamName(savedTeamName);
  }, []);

  useEffect(() => {
    if (!room) return;

    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = (params.get('room') || '').toUpperCase();
    const savedRoomCode = localStorage.getItem('verifiedRoomCode') || '';
    const candidateCode = codeFromUrl || savedRoomCode;

    if (candidateCode && candidateCode === room.code) {
      setRoomVerified(true);
      setRoomCode(candidateCode);

      const savedTeamName = localStorage.getItem('teamName') || '';
      if (savedTeamName && room.teams[savedTeamName]) {
        setJoinedTeamName(savedTeamName);
      }
    }
  }, [room]);

  useEffect(() => {
    if (!room || !joinedTeamName) return;

    const currentTeam = room.teams[joinedTeamName];
    if (!currentTeam) return;

    const previousStatus = previousStatusRef.current;
    const currentStatus = currentTeam.status;

    if (previousStatus && previousStatus !== currentStatus) {
      if (currentStatus === 'complete') {
        setResultModal({
          kind: 'success',
          title: '제외 성공!',
          message: `ROUND ${currentTeam.round} 제외에 성공했습니다. 다음 라운드를 기다려 주세요.`,
          icon: '✅'
        });
      } else if (currentStatus === 'retry') {
        setResultModal({
          kind: 'failure',
          title: '제외 실패',
          message: '정답 카드가 포함되어 추리 타일 1개가 소모되었습니다. 다시 도전하세요.',
          icon: '💥'
        });
      } else if (currentStatus === 'success') {
        setResultModal({
          kind: 'final-success',
          title: '사건 해결!',
          message: '최종 추리에 성공했습니다. 축하합니다!',
          icon: '🏆'
        });
      } else if (currentStatus === 'gameover') {
        setResultModal({
          kind: 'gameover',
          title: 'GAME OVER',
          message: '남은 추리 타일이 없습니다.',
          icon: '☠'
        });
      }
    }

    previousStatusRef.current = currentStatus;
  }, [room, joinedTeamName]);

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8 text-center">
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <p className="mt-5 text-white/70">현재 생성된 방이 없습니다.</p>
        </section>
      </main>
    );
  }

  function verifyRoom() {
    if (!room) return;
    const normalized = roomCode.trim().toUpperCase();

    if (!normalized) {
      setError('방 코드를 입력하세요.');
      return;
    }

    if (normalized !== room.code) {
      setError('잘못된 방 코드입니다.');
      return;
    }

    localStorage.setItem('verifiedRoomCode', normalized);
    setRoomVerified(true);
    setError('');
  }

  if (!roomVerified) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <input
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="방 코드"
            maxLength={6}
            className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 p-3 text-center text-2xl font-black tracking-[0.3em]"
          />
          {error && <p className="mt-3 text-center text-red-200">{error}</p>}
          <button
            type="button"
            onClick={verifyRoom}
            className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg"
          >
            방 입장 확인
          </button>
        </section>
      </main>
    );
  }

  const team = joinedTeamName ? room.teams[joinedTeamName] : undefined;

  if (team && !previousStatusRef.current) {
    previousStatusRef.current = team.status;
  }

  function joinTeam() {
    if (!room) return;
    const normalizedTeamName = teamName.trim();
    if (!normalizedTeamName) return;

    if (!room.teams[normalizedTeamName]) {
      room.teams[normalizedTeamName] = createTeam(normalizedTeamName, room.round);
    }

    localStorage.setItem('teamName', normalizedTeamName);
    localStorage.setItem('verifiedRoomCode', room.code);
    setJoinedTeamName(normalizedTeamName);
    saveRoom({ ...room });
  }

  if (!team) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">조 이름 입력</h1>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="예: 3조"
            className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 p-3"
          />
          <button
            type="button"
            onClick={joinTeam}
            className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg"
          >
            입장하기
          </button>
        </section>
      </main>
    );
  }

  function toggleCard(card: string) {
    if (!room || !team) return;
    if (['submitted', 'complete', 'gameover', 'success'].includes(team.status)) return;

    team.selected = team.selected.includes(card)
      ? team.selected.filter((item) => item !== card)
      : team.selected.length >= 6
        ? team.selected
        : [...team.selected, card];

    saveRoom({ ...room });
  }

  function submitExclusion() {
    if (!room || !team || team.selected.length !== 6) return;
    team.status = 'submitted';
    team.pending = { type: 'exclude', cards: team.selected };
    team.notice = '제출 완료: 교사 판정을 기다리세요.';
    saveRoom({ ...room });
  }

  return (
    <>
      <main className="min-h-screen p-4">
        <header className="mb-3 grid grid-cols-3 items-center">
          <div>
            <h1 className="text-4xl font-black">DYING MESSAGE</h1>
            <p className="text-white/60">소설가의 마지막 유언</p>
          </div>
          <div className="flex justify-center gap-3">
            <span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">
              {team.name}
            </span>
            <span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">
              ROUND {team.round}
            </span>
          </div>
          <div className="justify-self-end rounded-2xl bg-black/20 px-5 py-3">
            선택 <b className="text-raven-green">{team.selected.length}</b>/6
          </div>
        </header>

        <div className="grid grid-cols-[1fr_320px] gap-4">
          <section className="grid grid-rows-3 gap-3">
            {(['criminals', 'weapons', 'motives'] as Category[]).map((category) => (
              <CandidateGrid
                key={category}
                category={category}
                cards={room.candidates[category]}
                team={team}
                onToggle={toggleCard}
              />
            ))}
          </section>

          <aside className="space-y-3">
            <HintNotebook room={room} />

            <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
              <div className="flex justify-center gap-2">
                {team.guessTiles.map((alive, index) => (
                  <span
                    key={index}
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      alive ? 'bg-blue-600' : 'bg-red-600'
                    }`}
                  >
                    {alive ? '✓' : '×'}
                  </span>
                ))}
              </div>

              <button
                type="button"
                disabled={
                  team.selected.length !== 6 ||
                  team.status === 'submitted' ||
                  team.status === 'complete'
                }
                onClick={submitExclusion}
                className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg disabled:opacity-40"
              >
                제외 제출
              </button>
            </section>
          </aside>
        </div>
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
