export type Category='criminals'|'weapons'|'motives';export type HintTarget='criminal'|'weapon'|'motive';export type TileType='adjective'|'noun';
export interface HintTile{id:string;word:string;type:TileType}
export interface TeamState{name:string;round:number;status:'thinking'|'submitted'|'round-complete'|'retry'|'final-submitted'|'success'|'game-over';guessTiles:boolean[];excluded:Record<Category,string[]>;selected:string[];pending?:{type:'exclude';cards:string[]}|{type:'final';criminal:string;weapon:string;motive:string};notice?:string}
export interface GameRoom{code:string;globalRound:number;candidates:Record<Category,string[]>;answer:{criminal:string;weapon:string;motive:string};openTiles:HintTile[];hints:Record<HintTarget,HintTile[]>;teams:Record<string,TeamState>;createdAt:number}
