export type Category='criminals'|'weapons'|'motives';
export type HintTarget='criminal'|'weapon'|'motive';
export type Tile={id:string;word:string;type:'adjective'|'noun'};
export type Team={name:string;round:number;status:'thinking'|'submitted'|'complete'|'retry'|'success'|'gameover';guessTiles:boolean[];selected:string[];excluded:Record<Category,string[]>;pending?:{type:'exclude';cards:string[]}|{type:'final';criminal:string;weapon:string;motive:string};notice:string};
export type Room={code:string;round:number;candidates:Record<Category,string[]>;answer:{criminal:string;weapon:string;motive:string};openTiles:Tile[];hints:Record<HintTarget,Tile[]>;teams:Record<string,Team>};

export const criminals=['모델','음악가','바텐더','요리사','경찰','과학자','복서','마약상','시민','영화감독','건축가','미용사','의사','사기꾼','가수','군인','화가','야구선수','신문기자','아이돌','살인마','변호사','경호원'];
export const weapons=['하이힐','독버섯','망치','폭탄','케이블','넥타이','손도끼','트로피','벽돌','줄넘기','화분','가방','휴지통','곰인형','세탁기','냉장고','변기','코트','쇼핑백','베개','가위','권총','식칼'];
export const motives=['협박','재미','빚','불륜','시기','유산','배신','스토킹','강도'];
export const adjectives=['뜨거운','차가운','빠른','느린','복잡한','단순한','높은','낮은','무거운','가벼운','부드러운','딱딱한','많은','적은','똑똑한','멍청한','익숙한','낯선','차분한','아름다운','조용한','시끄러운','친절한','투명한','예술적인','계산적인','큰','작은','비싼','저렴한','얇은','두꺼운','어두운','밝은','오래된','새로운','외로운','냄새나는','긴','짧은','이기적인','답답한','숙련된','더러운'];
export const nouns=['홀수','짝수','달','여름','겨울','금속','나무','꽃','속도','별','바다','진동','갈증','원','삼각형','사각형','열정','냉정','곡선','직선','소음','믿음','고통','공간','시간','약속','기술','머리','팔','다리','몸','눈','대화','생활','밤','낮','관계','접촉','질서','맛','압박','자유','입','땅'];

const s=<T,>(a:T[],n:number)=>{const c=[...a],r:T[]=[];while(r.length<n&&c.length)r.push(c.splice(Math.floor(Math.random()*c.length),1)[0]);return r};
const p=<T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];
const tile=(word:string,type:'adjective'|'noun'):Tile=>({id:`${type}-${word}`,word,type});

export function createRoom():Room{const cs=s(criminals,9),ws=s(weapons,9);return{code:Math.random().toString(36).slice(2,8).toUpperCase(),round:1,candidates:{criminals:cs,weapons:ws,motives},answer:{criminal:p(cs),weapon:p(ws),motive:p(motives)},openTiles:[...s(adjectives,6).map(w=>tile(w,'adjective')),...s(nouns,6).map(w=>tile(w,'noun'))],hints:{criminal:[],weapon:[],motive:[]},teams:{}}}
export function createTeam(name:string,round:number):Team{return{name,round,status:'thinking',guessTiles:[true,true,true,true],selected:[],excluded:{criminals:[],weapons:[],motives:[]},notice:'수사 시작'}}
export function categoryOf(r:Room,c:string):Category{if(r.candidates.criminals.includes(c))return'criminals';if(r.candidates.weapons.includes(c))return'weapons';return'motives'}
export const usedTileIds=(r:Room)=>new Set(Object.values(r.hints).flat().map(t=>t.id));
export function addRoundTiles(r:Room){const words=r.openTiles.map(t=>t.word);const ad=adjectives.filter(w=>!words.includes(w));const no=nouns.filter(w=>!words.includes(w));if(ad.length)r.openTiles.push(tile(p(ad),'adjective'));if(no.length)r.openTiles.push(tile(p(no),'noun'))}
export function resolveTeam(r:Room,name:string){const t=r.teams[name];if(!t?.pending)return;if(t.pending.type==='exclude'){const ans=[r.answer.criminal,r.answer.weapon,r.answer.motive];const fail=t.pending.cards.some(c=>ans.includes(c));if(fail){const i=t.guessTiles.findIndex(Boolean);if(i>=0)t.guessTiles[i]=false;t.status=t.guessTiles.some(Boolean)?'retry':'gameover';t.notice=t.status==='retry'?`제외 실패: ROUND ${t.round} 재도전`:'GAME OVER'}else{for(const c of t.pending.cards){const cat=categoryOf(r,c);if(!t.excluded[cat].includes(c))t.excluded[cat].push(c)}t.status='complete';t.notice=`제외 성공: ROUND ${t.round} 완료`}t.selected=[];t.pending=undefined;return}const q=t.pending;const ok=q.criminal===r.answer.criminal&&q.weapon===r.answer.weapon&&q.motive===r.answer.motive;if(ok){t.status='success';t.notice='최종 추리 성공!'}else{const i=t.guessTiles.findIndex(Boolean);if(i>=0)t.guessTiles[i]=false;t.status=t.guessTiles.some(Boolean)?'thinking':'gameover';t.notice=t.status==='thinking'?'최종 추리 실패: 다시 시도':'GAME OVER'}t.pending=undefined}
export function canNext(r:Room){const alive=Object.values(r.teams).filter(t=>t.status!=='gameover');return alive.length>0&&alive.every(t=>t.status==='complete'||t.status==='success')}
export function nextRound(r:Room){r.round=Math.min(4,r.round+1);if(r.round===2||r.round===3)addRoundTiles(r);Object.values(r.teams).forEach(t=>{if(t.status!=='gameover'&&t.status!=='success'){t.round=r.round;t.status='thinking';t.selected=[];t.notice=r.round===4?'최종 추리를 진행하세요.':`ROUND ${r.round} 시작`}})}
