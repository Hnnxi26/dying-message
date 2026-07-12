'use client';

import { useEffect, useRef, useState } from 'react';
import type { Room } from '@/lib/localGame';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
const COLLECTION = 'rooms';
const TEACHER_ROOM_KEY = 'teacherRoomCode';
const POLL_MS = 800;
const REQUEST_TIMEOUT_MS = 10000;

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

function documentUrl(code: string): string {
  const normalized = encodeURIComponent(code.trim().toUpperCase());
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    PROJECT_ID
  )}/databases/(default)/documents/${COLLECTION}/${normalized}?key=${encodeURIComponent(
    API_KEY
  )}`;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(encodeValue)
      }
    };
  }

  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (child !== undefined) {
        fields[key] = encodeValue(child);
      }
    }

    return {
      mapValue: {
        fields
      }
    };
  }

  return { nullValue: null };
}

function encodeFields(room: Room): Record<string, FirestoreValue> {
  const encoded = encodeValue(room);
  if ('mapValue' in encoded) {
    return encoded.mapValue.fields ?? {};
  }
  return {};
}

function decodeValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('stringValue' in value) return value.stringValue;

  if ('arrayValue' in value) {
    return (value.arrayValue.values ?? []).map(decodeValue);
  }

  if ('mapValue' in value) {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value.mapValue.fields ?? {})) {
      result[key] = decodeValue(child);
    }
    return result;
  }

  return null;
}

function decodeDocument(document: FirestoreDocument): Room {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(document.fields ?? {})) {
    result[key] = decodeValue(value);
  }

  return result as unknown as Room;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: 'no-store'
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readDocument(
  code: string
): Promise<{ room: Room; updateTime: string } | null> {
  const response = await fetchWithTimeout(documentUrl(code));

  if (response.status === 404) return null;

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `방 정보를 불러오지 못했습니다. (${response.status}) ${detail}`
    );
  }

  const document = (await response.json()) as FirestoreDocument;

  return {
    room: decodeDocument(document),
    updateTime: document.updateTime ?? ''
  };
}

async function writeDocument(
  room: Room,
  updateTime?: string
): Promise<void> {
  const url = new URL(documentUrl(room.code));

  if (updateTime) {
    url.searchParams.set('currentDocument.updateTime', updateTime);
  }

  const response = await fetchWithTimeout(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: encodeFields(room)
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(
      `방 정보를 저장하지 못했습니다. (${response.status}) ${detail}`
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
}

export const firebaseReady = Boolean(PROJECT_ID && API_KEY);

export function getSavedTeacherRoomCode(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TEACHER_ROOM_KEY) ?? '';
}

export function saveTeacherRoomCode(code: string): void {
  localStorage.setItem(TEACHER_ROOM_KEY, code.toUpperCase());
}

export function clearSavedTeacherRoomCode(): void {
  localStorage.removeItem(TEACHER_ROOM_KEY);
}

export async function createRemoteRoom(room: Room): Promise<void> {
  if (!firebaseReady) {
    throw new Error('Firebase 환경변수가 적용되지 않았습니다.');
  }

  await writeDocument(room);
  saveTeacherRoomCode(room.code);
}

export async function getRemoteRoom(code: string): Promise<Room | null> {
  if (!firebaseReady || !code.trim()) return null;
  return (await readDocument(code))?.room ?? null;
}

export async function mutateRoom(
  code: string,
  mutator: (draft: Room) => void
): Promise<void> {
  if (!firebaseReady) {
    throw new Error('Firebase 환경변수가 적용되지 않았습니다.');
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const current = await readDocument(code);

    if (!current) {
      throw new Error('방을 찾을 수 없습니다.');
    }

    const draft = structuredClone(current.room);
    mutator(draft);

    try {
      await writeDocument(draft, current.updateTime);
      return;
    } catch (cause) {
      const status = (cause as Error & { status?: number }).status;

      // 다른 조가 같은 순간 먼저 저장한 경우 최신 방을 다시 읽고 재시도합니다.
      if (status === 409 || status === 412) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, 80 + attempt * 100)
        );
        continue;
      }

      throw cause;
    }
  }

  throw new Error('동시에 요청이 많아 저장하지 못했습니다. 다시 시도해 주세요.');
}

export async function deleteRemoteRoom(code: string): Promise<void> {
  if (code) {
    const response = await fetchWithTimeout(documentUrl(code), {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`방 삭제에 실패했습니다. (${response.status})`);
    }
  }

  clearSavedTeacherRoomCode();
}

export function useRemoteRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [error, setError] = useState('');
  const lastJsonRef = useRef('');

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;

    if (!code || !firebaseReady) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    async function poll() {
      try {
        const current = await readDocument(code);

        if (cancelled) return;

        const nextRoom = current?.room ?? null;
        const nextJson = JSON.stringify(nextRoom);

        if (nextJson !== lastJsonRef.current) {
          lastJsonRef.current = nextJson;
          setRoom(nextRoom);
        }

        setError('');
        setLoading(false);
      } catch (cause) {
        if (cancelled) return;

        setError(
          cause instanceof Error
            ? cause.message
            : '방 연결에 실패했습니다.'
        );
        setLoading(false);
      } finally {
        if (!cancelled) {
          timerId = window.setTimeout(poll, POLL_MS);
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [code]);

  return { room, loading, error };
}
