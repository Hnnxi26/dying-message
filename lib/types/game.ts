export type CardCategory = 'criminals' | 'weapons' | 'motives';
export type HintTarget = 'criminal' | 'weapon' | 'motive';
export type TileType = 'adjective' | 'noun';

export interface HintTile {
  id: string;
  word: string;
  type: TileType;
  usedBy?: HintTarget;
  published: boolean;
}

export interface TeamState {
  id: string;
  name: string;
  round: 1 | 2 | 3 | 4;
  status: 'thinking' | 'submitted' | 'round-complete' | 'retry' | 'final' | 'success' | 'game-over';
  guessTiles: boolean[];
  excluded: Record<CardCategory, string[]>;
  selected: string[];
  notice?: string;
}

export interface GameRoom {
  id: string;
  code: string;
  globalRound: 1 | 2 | 3 | 4;
  candidates: Record<CardCategory, string[]>;
  answer: {
    criminal: string;
    weapon: string;
    motive: string;
  };
  openTiles: HintTile[];
  hints: Record<HintTarget, HintTile[]>;
  draftHints: Record<HintTarget, HintTile[]>;
  teams: Record<string, TeamState>;
}
