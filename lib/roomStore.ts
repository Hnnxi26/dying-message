'use client';

import { useEffect, useState } from 'react';
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc
} from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase/client';
import type { Room } from '@/lib/localGame';

const COLLECTION = 'rooms';
const TEACHER_ROOM_KEY = 'teacherRoomCode';
const REQUEST_TIMEOUT_MS = 15000;

function roomRef(code: string) {
  return doc(db, COLLECTION, code.toUpperCase());
}

function withTimeout<T>(
  promise: Promise<T>,
  message: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    })
  ]);
}

export function getSavedTeacherRoomCode(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TEACHER_ROOM_KEY) ?? '';
}

export function saveTeacherRoomCode(code: string) {
  localStorage.setItem(TEACHER_ROOM_KEY, code.toUpperCase());
}

export function clearSavedTeacherRoomCode() {
  localStorage.removeItem(TEACHER_ROOM_KEY);
}

export async function createRemoteRoom(room: Room): Promise<void> {
  if (!firebaseReady) {
    throw new Error('Firebase 환경변수가 적용되지 않았습니다.');
  }

  await withTimeout(
    setDoc(roomRef(room.code), room),
    'Firestore 연결이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
  );

  saveTeacherRoomCode(room.code);
}

export async function getRemoteRoom(code: string): Promise<Room | null> {
  if (!firebaseReady || !code.trim()) return null;

  const snapshot = await withTimeout(
    getDoc(roomRef(code)),
    '방 정보를 불러오지 못했습니다. 네트워크를 확인해 주세요.'
  );

  return snapshot.exists() ? (snapshot.data() as Room) : null;
}

export async function mutateRoom(
  code: string,
  mutator: (draft: Room) => void
): Promise<void> {
  if (!firebaseReady) {
    throw new Error('Firebase 환경변수가 적용되지 않았습니다.');
  }

  await withTimeout(
    runTransaction(db, async (transaction) => {
      const ref = roomRef(code);
      const snapshot = await transaction.get(ref);

      if (!snapshot.exists()) {
        throw new Error('방을 찾을 수 없습니다.');
      }

      const draft = structuredClone(snapshot.data() as Room);
      mutator(draft);
      transaction.set(ref, draft);
    }),
    '변경 내용을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  );
}

export async function deleteRemoteRoom(code: string): Promise<void> {
  if (code) {
    await withTimeout(
      deleteDoc(roomRef(code)),
      '방 삭제가 지연되고 있습니다.'
    );
  }

  clearSavedTeacherRoomCode();
}

export function useRemoteRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code || !firebaseReady) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const unsubscribe = onSnapshot(
      roomRef(code),
      (snapshot) => {
        setRoom(snapshot.exists() ? (snapshot.data() as Room) : null);
        setLoading(false);
      },
      (cause) => {
        setError(cause.message);
        setLoading(false);
      }
    );

    const timeoutId = window.setTimeout(() => {
      setLoading(false);
      setError((current) =>
        current || 'Firestore 연결이 지연되고 있습니다.'
      );
    }, REQUEST_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [code]);

  return { room, loading, error };
}
