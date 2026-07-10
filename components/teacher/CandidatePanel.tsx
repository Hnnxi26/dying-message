export function CandidatePanel({
  title,
  items,
  answer
}: {
  title: string;
  items: string[];
  answer: string;
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black/15 p-4">
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item}
            className={`rounded-xl px-3 py-2 text-center text-sm font-bold ${
              item === answer
                ? 'border border-raven-gold bg-raven-gold/20 text-raven-gold'
                : 'bg-white/10'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
