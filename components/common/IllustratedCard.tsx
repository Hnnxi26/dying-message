'use client';

import { useState } from 'react';
import type { Category } from '@/lib/localGame';
import { getCardArt } from '@/lib/cardArt';

const fallbackIcon: Record<Category, string> = {
  criminals: '♙',
  weapons: '⚒',
  motives: '✦'
};

export function IllustratedCard({
  category,
  name,
  className = ''
}: {
  category: Category;
  name: string;
  className?: string;
}) {
  const art = getCardArt(category, name);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article
      className={`relative aspect-[2/3] overflow-hidden rounded-2xl border-2 border-white/30 bg-[#f4efe5] text-[#211934] shadow-2xl ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[78%] overflow-hidden bg-[#ddd3c2]">
        {art && !imageFailed ? (
          <img
            src={art.image}
            alt=""
            draggable={false}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-b from-[#ede4d4] to-[#cbbca4]">
            <span className="text-7xl">{fallbackIcon[category]}</span>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 grid h-[22%] place-items-center border-t border-black/15 bg-[#f8f3e9] px-3">
        <b className="text-center text-xl leading-tight">{name}</b>
      </div>
    </article>
  );
}
