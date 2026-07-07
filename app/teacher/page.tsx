'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase/client';
import { addRoundTiles, canStartNextRound, createRoom, resolveExclude, resolveFinal } from '@/lib/game/engine';
import type { GameRoom, HintTarget, HintTile } from '@/lib/types/game';
import { HintTile as Tile } from '@/components/HintTile';

const labels: Record<HintTarget, string> = { criminal: '범인', weapon: '도구', motive: '동기' };

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function TeacherPage() {
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [selected, setSelected] = useState<HintTile | null>(null);
  const [target, setTarget] = useState<HintTarget>('criminal');
  const [busy, setBusy] = useState(false);
  const [debug, setDebug] = useState('대기 중');

  useEffect(() => {
    const saved = localStorage.getItem('teacherRoomCode');
    if (saved) {
      setCode(saved);
      setDebug(`저장된 방 코드 불러옴: ${saved}`);
    }
  }, []);

  useEffect(() => {
    if (!code || !firebaseReady) return;

    setDebug(`Firestore 구독 시작: ${code}`);

    return onSnapshot(
      doc(db, 'rooms', code),
      (snap) => {
        if (snap.exists()) {
          setRoom(snap.data() as GameRoom);
          setDebug(`방 데이터 수신 성공: ${code}`);
        } else {
          setRoom(null);
          setDebug(`방 데이터 없음: ${code}`);
        }
      },
      (error) => {
        const message = error.message;
        setDebug(`Firestore 구독 실패: ${message}`);
        alert(`Firestore 구독 실패: ${message}`);
      }
    );
  }, [code]);

  const url = typeof window !== 'undefined' && code ? `${window.location.origin}/student?room=${code}` : '';

  async function makeRoom() {
    if (!firebaseReady) {
      alert('Firebase 환경변수가 적용되지 않았습니다. Vercel 환경변수와 Redeploy를 확인하세요.');
      return;
    }

    setBusy(true);
    setDebug('방 생성 시도 중...');

    try {
      const newRoom = createRoom();
      setDebug(`방 객체 생성 완료: ${newRoom.code}`);

      await setDoc(doc(db, 'rooms', newRoom.code), newRoom);
      setDebug(`Firestore 저장 완료: ${newRoom.code}`);

      const check = await getDoc(doc(db, 'rooms', newRoom.code));
      if (!check.exists()) {
        throw new Error('Firestore 저장 후 문서를 다시 읽지 못했습니다.');
      }

      localStorage.setItem('teacherRoomCode', newRoom.code);
      setCode(newRoom.code);
      setRoom(newRoom);
      setDebug(`방 생성 성공: ${newRoom.code}`);
      alert(`방 생성 성공: ${newRoom.code}`);
    } catch (error) {
      const message = errorText(error);
      console.error('방 생성 실패:', error);
      setDebug(`방 생성 실패: ${message}`);
      alert(`방 생성 실패: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  async function save(next: GameRoom) {
    setBusy(true);
    try {
      await setDoc(doc(db, 'rooms', next.code), next);
      setDebug('저장 성공');
    } catch (error) {
      const message = errorText(error);
      console.error('저장 실패:', error);
      setDebug(`저장 실패: ${message}`);
      alert(`저장 실패: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!room || !selected) return;

    const used = Object.values(room.hints).flat().some((tile) => tile.id === selected.id);
    if (used) return alert('이미 사용한 타일입니다.');

    await save({
      ...room,
      hints: {
        ...room.hints,
        [target]: [...room.hints[target], selected]
      }
    });

    setSelected(null);
  }

  async function resolve(name: string) {
    if (!room) return;

    const team = room.teams[name];
    if (!team.pending) return;

    const resolved = team.pending.type === 'exclude' ? resolveExclude(room, team) : resolveFinal(room, team);

    setBusy(true);
    try {
      await updateDoc(doc(db, 'rooms', room.code), { [`teams.${name}`]: resolved });
      setDebug(`${name} 판정 반영 완료`);
    } catch (error) {
      const message = errorText(error);
      console.error('판정 반영 실패:', error);
      setDebug(`판정 반영 실패: ${message}`);
      alert(`판정 반영 실패: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  async function nextRound() {
    if (!room) return;

    let next = { ...room, globalRound: Math.min(4, room.globalRound + 1) } as GameRoom;

    if (next.globalRound === 2 || next.globalRound === 3) {
      next = addRoundTiles(next);
    }

    const teams = { ...next.teams };

    for (const [name, team] of Object.entries(teams)) {
      if (team.status !== 'game-over' && team.status !== 'success') {
        teams[name] = {
          ...team,
          round: next.globalRound,
          status: 'thinking',
          notice: next.globalRound === 4 ? '최종 추리를 진행하세요.' : `ROUND ${next.globalRound} 시작`
        };
      }
    }

    await save({ ...next, teams });
  }

  function resetLocalRoom() {
    localStorage.removeItem('teacherRoomCode');
    setCode('');
    setRoom(null);
    setDebug('저장된 방 코드 삭제 완료');
  }

  const usedIds = useMemo(
    () => new Set(room ? Object.values(room.hints).flat().map((tile) => tile.id) : []),
    [room]
  );

  if (!firebaseReady) {
    return (
      <main className="p-8">
        <div className="rounded-3xl bg-raven-panel p-6">
          Firebase 환경변수가 없습니다. Vercel 환경변수와 Redeploy를 확인하세요.
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>

          <button
            className="mt-6 rounded-2xl bg-raven-gold px-6 py-4 font-black text-raven-bg disabled:opacity-40"
            onClick={makeRoom}
            disabled={busy}
            type="button"
          >
            {busy ? '방 만드는 중...' : '방 만들기'}
          </button>

          <div className="mt-5 rounded-2xl bg-black/20 p-4 text-sm text-white/70">
            <b>상태</b>
            <br />
            {debug}
          </div>

          {code && (
            <button
              className="mt-3 rounded-xl border border-white/30 px-4 py-2 text-sm"
              onClick={resetLocalRoom}
              type="button"
            >
              저장된 방 코드 초기화
            </button>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>
          <p className="text-white/60">방 코드 {room.code} · ROUND {room.globalRound}</p>
          <p className="text-xs text-white/40">{debug}</p>
        </div>

        <button
          className="rounded-2xl bg-raven-gold px-5 py-3 font-black text-raven-bg disabled:opacity-40"
          disabled={!canStartNextRound(room) || room.globalRound >= 4 || busy}
          onClick={nextRound}
          type="button"
        >
          다음 라운드 시작
        </button>
      </header>

      <div className="grid grid-cols-[1fr_380px] gap-4">
        <section className="space-y-4">
          <article className="rounded-3xl border border-raven-gold/40 bg-raven-gold/10 p-5">
            <h2 className="mb-2 text-2xl font-black">정답</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>범인<br /><b>{room.answer.criminal}</b></div>
              <div>도구<br /><b>{room.answer.weapon}</b></div>
              <div>동기<br /><b>{room.answer.motive}</b></div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="mb-2 text-2xl font-black">공통 힌트</h2>

            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(labels) as HintTarget[]).map((key) => (
                <div
                  key={key}
                  className={`rounded-2xl border-2 border-dashed p-4 ${target === key ? 'border-raven-gold bg-raven-gold/10' : 'border-white/20'}`}
                  onClick={() => setTarget(key)}
                >
                  <b>{labels[key]}</b>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.hints[key].map((tile) => <Tile key={tile.id} tile={tile} />)}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-5 font-black">공개 타일</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {room.openTiles.map((tile) => (
                <button
                  key={tile.id}
                  disabled={usedIds.has(tile.id)}
                  onClick={() => setSelected(tile)}
                  type="button"
                  className={`rounded-xl ${selected?.id === tile.id ? 'ring-4 ring-raven-gold' : ''} ${usedIds.has(tile.id) ? 'opacity-30' : ''}`}
                >
                  <Tile tile={tile} />
                </button>
              ))}
            </div>

            <button
              className="mt-4 rounded-2xl bg-raven-gold px-5 py-3 font-black text-raven-bg disabled:opacity-40"
              onClick={publish}
              disabled={!selected || busy}
              type="button"
            >
              선택한 타일을 {labels[target]} 힌트로 공개
            </button>
          </article>
        </section>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="mb-3 text-2xl font-black">QR 입장</h2>
            {url && <QRCodeSVG value={url} size={180} bgColor="#fff" fgColor="#111" />}
            <p className="mt-3 break-all text-sm text-white/60">{url}</p>
          </article>

          <article className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <h2 className="mb-3 text-2xl font-black">조 현황</h2>
            <div className="space-y-2">
              {Object.values(room.teams).map((team) => (
                <div key={team.name} className="rounded-2xl bg-white/10 p-3">
                  <div className="flex justify-between">
                    <b>{team.name}</b>
                    <span>ROUND {team.round}</span>
                  </div>

                  <div className="text-sm text-white/70">상태: {team.status}</div>
                  <div className="text-sm text-white/70">{team.notice}</div>

                  {team.pending && (
                    <button
                      className="mt-2 rounded-xl bg-raven-gold px-3 py-2 font-black text-raven-bg"
                      onClick={() => resolve(team.name)}
                      type="button"
                    >
                      자동 판정 반영
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
