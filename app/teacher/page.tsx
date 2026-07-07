'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase/client';
import { createRoom } from '@/lib/game/engine';
import type { GameRoom } from '@/lib/types/game';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function TeacherPage() {
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [status, setStatus] = useState('대기 중');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('teacherRoomCode');
    if (saved) {
      setRoomCode(saved);
      setStatus(`저장된 방 코드 확인 중: ${saved}`);
    }
  }, []);

  useEffect(() => {
    if (!roomCode || !firebaseReady) return;
    setStatus(`Firestore 연결 중: ${roomCode}`);
    return onSnapshot(
      doc(db, 'rooms', roomCode),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GameRoom;
          setRoom(data);
          setStatus(`방 연결 성공: ${data.code}`);
        } else {
          setRoom(null);
          setStatus(`방 없음: ${roomCode}`);
        }
      },
      (error) => {
        const message = getErrorMessage(error);
        setStatus(`Firestore 구독 오류: ${message}`);
        alert(`Firestore 구독 오류: ${message}`);
      }
    );
  }, [roomCode]);

  const studentUrl = typeof window !== 'undefined' && room ? `${window.location.origin}/student?room=${room.code}` : '';

  async function handleCreateRoom() {
    setLoading(true);
    setStatus('방 생성 시작');
    try {
      if (!firebaseReady) {
        throw new Error('Firebase 환경변수가 적용되지 않았습니다. Vercel 환경변수와 Redeploy를 확인하세요.');
      }
      const newRoom = createRoom();
      setStatus(`방 코드 생성 완료: ${newRoom.code}`);
      const ref = doc(db, 'rooms', newRoom.code);
      await setDoc(ref, newRoom);
      setStatus(`Firestore 저장 요청 완료: ${newRoom.code}`);
      const check = await getDoc(ref);
      if (!check.exists()) {
        throw new Error('저장 후 Firestore에서 방 문서를 찾지 못했습니다.');
      }
      localStorage.setItem('teacherRoomCode', newRoom.code);
      setRoomCode(newRoom.code);
      setRoom(check.data() as GameRoom);
      setStatus(`방 생성 성공: ${newRoom.code}`);
      alert(`방 생성 성공: ${newRoom.code}`);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('방 생성 실패:', error);
      setStatus(`방 생성 실패: ${message}`);
      alert(`방 생성 실패: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function resetLocalRoom() {
    localStorage.removeItem('teacherRoomCode');
    setRoomCode('');
    setRoom(null);
    setStatus('저장된 방 코드 초기화 완료');
  }

  if (!firebaseReady) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>
          <p className="mt-5 rounded-2xl bg-red-500/20 p-4">Firebase 환경변수가 없습니다. Vercel 환경변수와 Redeploy를 확인하세요.</p>
        </section>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-xl rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">Teacher Dashboard</h1>
          <button type="button" onClick={handleCreateRoom} disabled={loading} className="mt-6 rounded-2xl bg-raven-gold px-6 py-4 font-black text-raven-bg disabled:opacity-50">
            {loading ? '방 만드는 중...' : '방 만들기'}
          </button>
          <div className="mt-5 rounded-2xl bg-black/20 p-4 text-sm text-white/80"><b>상태</b><br />{status}</div>
          {roomCode && <button type="button" onClick={resetLocalRoom} className="mt-3 rounded-xl border border-white/30 px-4 py-2 text-sm">저장된 방 코드 초기화</button>}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="text-4xl font-black">Teacher Dashboard</h1>
            <p className="mt-2 text-white/70">방 생성 테스트 화면</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-4"><div className="text-sm text-white/60">방 코드</div><div className="text-3xl font-black text-raven-gold">{room.code}</div></div>
              <div className="rounded-2xl bg-white/10 p-4"><div className="text-sm text-white/60">현재 라운드</div><div className="text-3xl font-black">ROUND {room.globalRound}</div></div>
              <div className="rounded-2xl bg-white/10 p-4"><div className="text-sm text-white/60">입장 조</div><div className="text-3xl font-black">{Object.keys(room.teams).length}조</div></div>
            </div>
            <div className="mt-6 rounded-2xl bg-black/20 p-4 text-sm text-white/80"><b>상태</b><br />{status}</div>
            <button type="button" onClick={resetLocalRoom} className="mt-4 rounded-xl border border-white/30 px-4 py-2 text-sm">새 방 만들기 위해 초기화</button>
          </div>
          <div className="rounded-3xl bg-white p-5 text-black">
            <QRCodeSVG value={studentUrl} size={190} />
            <p className="mt-3 max-w-[220px] break-all text-xs">{studentUrl}</p>
          </div>
        </div>
        <div className="mt-8 rounded-3xl border border-raven-gold/40 bg-raven-gold/10 p-5">
          <h2 className="text-2xl font-black">정답 교사용</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>범인<br /><b>{room.answer.criminal}</b></div>
            <div>도구<br /><b>{room.answer.weapon}</b></div>
            <div>동기<br /><b>{room.answer.motive}</b></div>
          </div>
        </div>
      </section>
    </main>
  );
}
