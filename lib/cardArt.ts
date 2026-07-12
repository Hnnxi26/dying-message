import type { Category } from '@/lib/localGame';

export type CardArt = {
  slug: string;
  image: string;
};

const criminalSlugs: Record<string, string> = {
  모델: 'model',
  음악가: 'musician',
  바텐더: 'bartender',
  요리사: 'chef',
  경찰: 'police',
  과학자: 'scientist',
  복서: 'boxer',
  마약상: 'drug-dealer',
  시민: 'citizen',
  영화감독: 'film-director',
  건축가: 'architect',
  미용사: 'hairdresser',
  의사: 'doctor',
  사기꾼: 'fraudster',
  가수: 'singer',
  군인: 'soldier',
  화가: 'painter',
  야구선수: 'baseball-player',
  신문기자: 'reporter',
  아이돌: 'idol',
  살인마: 'killer',
  변호사: 'lawyer',
  경호원: 'bodyguard'
};

const weaponSlugs: Record<string, string> = {
  하이힐: 'high-heels',
  독버섯: 'poison-mushroom',
  망치: 'hammer',
  폭탄: 'bomb',
  케이블: 'cable',
  넥타이: 'necktie',
  손도끼: 'hatchet',
  트로피: 'trophy',
  벽돌: 'brick',
  줄넘기: 'jump-rope',
  화분: 'flowerpot',
  가방: 'bag',
  휴지통: 'trash-can',
  곰인형: 'teddy-bear',
  세탁기: 'washing-machine',
  냉장고: 'refrigerator',
  변기: 'toilet',
  코트: 'coat',
  쇼핑백: 'shopping-bag',
  베개: 'pillow',
  가위: 'scissors',
  권총: 'pistol',
  식칼: 'kitchen-knife'
};

const motiveSlugs: Record<string, string> = {
  협박: 'blackmail',
  재미: 'amusement',
  빚: 'debt',
  불륜: 'affair',
  시기: 'envy',
  유산: 'inheritance',
  배신: 'betrayal',
  스토킹: 'stalking',
  강도: 'robbery'
};

const slugTables: Record<Category, Record<string, string>> = {
  criminals: criminalSlugs,
  weapons: weaponSlugs,
  motives: motiveSlugs
};

const folderByCategory: Record<Category, string> = {
  criminals: 'criminal',
  weapons: 'weapon',
  motives: 'motive'
};

export function getCardArt(
  category: Category,
  name: string
): CardArt | null {
  const slug = slugTables[category][name];
  if (!slug) return null;

  return {
    slug,
    image: `/cards/${folderByCategory[category]}/${slug}.webp`
  };
}

export function getCardBack(category: Category): string {
  const file =
    category === 'criminals'
      ? 'criminal.webp'
      : category === 'weapons'
        ? 'weapon.webp'
        : 'motive.webp';

  return `/cards/back/${file}`;
}
