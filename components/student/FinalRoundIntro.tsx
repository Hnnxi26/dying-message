'use client';

import { useEffect } from 'react';

export function FinalRoundIntro({
  open,
  onFinish,
  duration = 2200
}: {
  open: boolean;
  onFinish: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(onFinish, duration);
    return () => window.clearTimeout(timer);
  }, [open, onFinish, duration]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#35131f] p-8">
      <section className="text-center">
        <p className="text-3xl font-black tracking-[0.45em] text-[#e5a6ae]">
          FINAL ROUND
        </p>

        <h1 className="mt-8 text-8xl font-black text-white">
          최종 추리
        </h1>

        <p className="mt-10 text-3xl font-bold text-white/70">
          범인·도구·동기를 한 장씩 선택하세요.
        </p>

        <button
          type="button"
          onClick={onFinish}
          className="mt-12 rounded-2xl border border-white/25 bg-white/10 px-8 py-3 text-lg font-black text-white/80"
        >
          바로 시작
        </button>
      </section>
    </div>
  );
}
