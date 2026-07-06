import { adjectives, criminals, motives, nouns, weapons } from '@/lib/data/cards';
import type { CardCategory, GameRoom, HintTile, TeamState } from '@/lib/types/game';

function sample<T>(items: T[], count: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  while (result.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function tile(word: string, type: 'adjective' | 'noun'): HintTile {
  return {
    id: `${type}-${word}`,
    word,
    type,
    published: false
  };
}

export function createRoom(): GameRoom {
  const candidateCriminals = sample(criminals, 9);
  const candidateWeapons = sample(weapons, 9);

  return {
    id: crypto.randomUUID(),
    code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    globalRound: 1,
    candidates: {
      criminals: candidateCriminals,
      weapons: candidateWeapons,
      motives
    },
    answer: {
      criminal: pick(candidateCriminals),
      weapon: pick(candidateWeapons),
      motive: pick(motives)
    },
    openTiles: [
      ...sample(adjectives, 6).map((word) => tile(word, 'adjective')),
      ...sample(nouns, 6).map((word) => tile(word, 'noun'))
    ],
    hints: {
      criminal: [],
      weapon: [],
      motive: []
    },
    draftHints: {
      criminal: [],
      weapon: [],
      motive: []
    },
    teams: {}
  };
}

export function createTeam(name: string): TeamState {
  return {
    id: crypto.randomUUID(),
    name,
    round: 1,
    status: 'thinking',
    guessTiles: [true, true, true, true],
    excluded: {
      criminals: [],
      weapons: [],
      motives: []
    },
    selected: []
  };
}

export function cardCategory(room: GameRoom, card: string): CardCategory {
  if (room.candidates.criminals.includes(card)) return 'criminals';
  if (room.candidates.weapons.includes(card)) return 'weapons';
  return 'motives';
}

export function judgeExclude(room: GameRoom, team: TeamState, selectedCards: string[]): TeamState {
  const answerCards = [room.answer.criminal, room.answer.weapon, room.answer.motive];
  const failed = selectedCards.some((card) => answerCards.includes(card));

  if (failed) {
    const nextTiles = [...team.guessTiles];
    const aliveIndex = nextTiles.findIndex(Boolean);
    if (aliveIndex >= 0) nextTiles[aliveIndex] = false;

    return {
      ...team,
      status: nextTiles.some(Boolean) ? 'retry' : 'game-over',
      guessTiles: nextTiles,
      selected: [],
      notice: nextTiles.some(Boolean) ? '제외 실패: 같은 라운드를 다시 진행하세요.' : 'GAME OVER: 남은 추리 타일이 없습니다.'
    };
  }

  const excluded = structuredClone(team.excluded);

  for (const card of selectedCards) {
    const category = cardCategory(room, card);
    if (!excluded[category].includes(card)) {
      excluded[category].push(card);
    }
  }

  return {
    ...team,
    status: 'round-complete',
    excluded,
    selected: [],
    notice: `제외 성공: ROUND ${team.round} 완료`
  };
}

export function canAdvanceRound(room: GameRoom): boolean {
  const activeTeams = Object.values(room.teams).filter((team) => team.status !== 'game-over');
  return activeTeams.length > 0 && activeTeams.every((team) => team.status === 'round-complete' || team.status === 'success');
}
