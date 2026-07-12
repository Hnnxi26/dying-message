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

function roomRef(code: string) {
  return doc(db, COLLECTION, code.toUpperCase());
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
  if (!firebaseReady) throw new Error('Firebase 환경변수가 적용되지 않았습니다.');
  await setDoc(roomRef(room.code), room);
  saveTeacherRoomCode(room.code);
}

export async function getRemoteRoom(code: string): Promise<Room | null> {
  if (!firebaseReady || !code.trim()) return null;
  const snapshot = await getDoc(roomRef(code));
  return snapshot.exists() ? (snapshot.data() as Room) : null;
}

export async function mutateRoom(
  code: string,
  mutator: (draft: Room) => void
): Promise<void> {
  if (!firebaseReady) throw new Error('Firebase 환경변수가 적용되지 않았습니다.');

  await runTransaction(db, async (transaction) => {
    const ref = roomRef(code);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('방을 찾을 수 없습니다.');

    const draft = structuredClone(snapshot.data() as Room);
    mutator(draft);
    transaction.set(ref, draft);
  });
}

export async function deleteRemoteRoom(code: string): Promise<void> {
  if (code) await deleteDoc(roomRef(code));
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

    return onSnapshot(
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
  }, [code]);

  return { room, loading, error };
}
