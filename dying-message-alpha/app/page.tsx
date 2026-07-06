import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <section className="w-full max-w-3xl rounded-3xl border border-white/15 bg-raven-panel/90 p-8 shadow-2xl">
        <h1 className="text-5xl font-black tracking-wide">DYING MESSAGE</h1>
        <p className="mt-2 text-white/70">Classroom Edition Alpha</p>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <Link className="rounded-2xl bg-raven-gold px-5 py-4 text-center font-black text-raven-bg" href="/teacher">
            교사 화면
          </Link>
          <Link className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-center font-bold" href="/student">
            학생 화면
          </Link>
          <Link className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-center font-bold" href="/projector">
            프로젝터
          </Link>
        </div>

        <p className="mt-6 text-sm text-white/60">
          이번 버전은 정식 프로젝트 구조를 잡는 Alpha입니다. 다음 단계에서 Firebase 실시간 동기화를 연결합니다.
        </p>
      </section>
    </main>
  );
}
