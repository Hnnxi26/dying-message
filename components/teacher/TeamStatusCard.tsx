import type { Team } from '@/lib/localGame';

const statusView: Record<string, { label: string; icon: string; cls: string }> = {
  thinking: { label: '생각 중', icon: '🟡', cls: 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100' },
  submitted: { label: '제출 완료', icon: '🟢', cls: 'border-green-300/30 bg-green-400/10 text-green-100' },
  complete: { label: '라운드 완료', icon: '🔵', cls: 'border-blue-300/30 bg-blue-400/10 text-blue-100' },
  retry: { label: '재도전', icon: '🔴', cls: 'border-red-300/30 bg-red-400/10 text-red-100' },
  success: { label: '사건 해결', icon: '⭐', cls: 'border-raven-gold/40 bg-raven-gold/10 text-raven-gold' },
  gameover: { label: 'GAME OVER', icon: '☠', cls: 'border-white/20 bg-black/30 text-white/70' }
};

export function TeamStatusCard({
  team,
  onJudge
}: {
  team: Team;
  onJudge: () => void;
}) {
  const view = statusView[team.status] ?? statusView.thinking;

  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <b className="text-lg">{team.name}</b>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${view.cls}`}>
          {view.icon} {view.label}
        </span>
      </div>

      <p className="mt-2 text-sm text-white/70">{team.notice}</p>

      <div className="mt-2 flex gap-1">
        {team.guessTiles.map((alive, index) => (
          <span
            key={index}
            className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${
              alive ? 'bg-blue-600' : 'bg-red-600'
            }`}
          >
            {alive ? '✓' : '×'}
          </span>
        ))}
      </div>

      {team.pending?.type === 'exclude' && (
        <div className="mt-3">
          <p className="text-xs font-bold text-white/50">제출한 제외 카드</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {team.pending.cards.map((card) => (
              <span
                key={card}
                className="rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-xs font-bold"
              >
                {card}
              </span>
            ))}
          </div>
        </div>
      )}

      {team.pending && (
        <button
          type="button"
          onClick={onJudge}
          className="mt-3 w-full rounded-xl bg-raven-gold px-3 py-2 font-black text-raven-bg"
        >
          {team.pending.type === 'final' ? '최종 추리 판정' : '판정하기'}
        </button>
      )}
    </div>
  );
}
