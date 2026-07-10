export type ResultModalData = {
  kind: 'success' | 'failure' | 'final-success' | 'gameover';
  title: string;
  message: string;
  icon: string;
};

export function ResultModal({
  data,
  onClose
}: {
  data: ResultModalData;
  onClose: () => void;
}) {
  const success = data.kind === 'success' || data.kind === 'final-success';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-6">
      <section
        className={`w-full max-w-xl rounded-3xl border p-8 text-center shadow-2xl ${
          success
            ? 'border-green-300/50 bg-[#173a28]'
            : 'border-red-300/50 bg-[#471f2a]'
        }`}
      >
        <div className="text-7xl">{data.icon}</div>
        <h2 className="mt-5 text-4xl font-black">{data.title}</h2>
        <p className="mt-4 text-lg font-bold text-white/90">{data.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-2xl bg-white px-5 py-4 text-lg font-black text-black"
        >
          확인
        </button>
      </section>
    </div>
  );
}
