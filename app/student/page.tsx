'use client';

import { useEffect, useState } from 'react';
import { Category, Room, Team, createTeam } from '@/lib/localGame';
import { saveRoom, useRoom } from '@/lib/localStore';

const icon: Record<Category, string> = {
  criminals: '♙',
  weapons: '⚒',
  motives: '✦'
};

function Card({
  name,
  cat,
  selected,
  excluded,
  onClick
}: {
  name: string;
  cat: Category;
  selected: boolean;
  excluded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={excluded}
      onClick={onClick}
      className={[
        'relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#e7d8bd] text-[#211934] shadow transition',
        selected
          ? '-translate-y-1 border-raven-green ring-4 ring-raven-green/30'
          : 'border-white/20',
        excluded ? 'opacity-40 grayscale' : ''
      ].join(' ')}
    >
      <span className="text-3xl">{icon[cat]}</span>
      <b>{name}</b>
      {excluded && (
        <span className="absolute text-7xl font-black text-black/50">×</span>
      )}
    </button>
  );
}

function Chip({
  word,
  type
}: {
  word: string;
  type: 'adjective' | 'noun';
}) {
  return (
    <span
      className={`inline-flex rounded-xl px-3 py-2 text-sm font-black text-white ${
        type === 'adjective' ? 'bg-red-600' : 'bg-blue-600'
      }`}
    >
      {word}
    </span>
  );
}


function ResultNotice({ team }: { team: Team }) {
  const view = {
    submitted: {
      icon: '📨',
      title: '제출 완료',
      message: '교사의 판정을 기다리세요.',
      cls: 'border-green-300/40 bg-green-500/15 text-green-50'
    },
    complete: {
      icon: '🎉',
      title: '제외 성공!',
      message: '이번 라운드를 완료했습니다. 다음 라운드를 기다리세요.',
      cls: 'border-blue-300/40 bg-blue-500/15 text-blue-50'
    },
    retry: {
      icon: '💥',
      title: '제외 실패',
      message: '추리 타일 1개가 소모되었습니다. 같은 라운드에 다시 도전하세요.',
      cls: 'border-red-300/40 bg-red-500/15 text-red-50'
    },
    success: {
      icon: '🏆',
      title: '사건 해결!',
      message: '최종 추리에 성공했습니다.',
      cls: 'border-raven-gold/50 bg-raven-gold/15 text-raven-gold'
    },
    gameover: {
      icon: '☠',
      title: 'GAME OVER',
      message: '남은 추리 타일이 없습니다.',
      cls: 'border-white/25 bg-black/30 text-white/80'
    }
  } as const;

  const current = view[team.status as keyof typeof view];

  if (!current) {
    return team.notice ? (
      <div className="mb-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-center font-black">
        {team.notice}
      </div>
    ) : null;
  }

  return (
    <section className={`mb-3 rounded-2xl border p-4 text-center ${current.cls}`}>
      <div className="text-3xl">{current.icon}</div>
      <h2 className="mt-1 text-xl font-black">{current.title}</h2>
      <p className="mt-1 text-sm font-bold opacity-90">{current.message}</p>
    </section>
  );
}

export default function Student() {
  const room = useRoom();

  const [roomCode, setRoomCode] = useState('');
  const [roomVerified, setRoomVerified] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [joinedTeamName, setJoinedTeamName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = (params.get('room') || '').toUpperCase();
    const savedTeamName = localStorage.getItem('teamName') || '';
    const savedRoomCode = localStorage.getItem('verifiedRoomCode') || '';

    if (codeFromUrl) {
      setRoomCode(codeFromUrl);
    } else if (savedRoomCode) {
      setRoomCode(savedRoomCode);
    }

    setTeamName(savedTeamName);
  }, []);

  useEffect(() => {
    if (!room) return;

    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = (params.get('room') || '').toUpperCase();
    const savedRoomCode = localStorage.getItem('verifiedRoomCode') || '';
    const candidateCode = codeFromUrl || savedRoomCode;

    if (candidateCode && candidateCode === room.code) {
      setRoomVerified(true);
      setRoomCode(candidateCode);

      const savedTeamName = localStorage.getItem('teamName') || '';
      if (savedTeamName && room.teams[savedTeamName]) {
        setJoinedTeamName(savedTeamName);
      }
    }
  }, [room]);

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8 text-center">
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <p className="mt-5 text-white/70">현재 생성된 방이 없습니다.</p>
          <p className="mt-2 text-sm text-white/50">
            교사가 먼저 방을 만들어야 합니다.
          </p>
        </section>
      </main>
    );
  }

  function verifyRoom() {
    if (!room) return;

    const normalized = roomCode.trim().toUpperCase();

    if (!normalized) {
      setError('방 코드를 입력하세요.');
      return;
    }

    if (normalized !== room.code) {
      setError('잘못된 방 코드입니다.');
      setRoomVerified(false);
      return;
    }

    localStorage.setItem('verifiedRoomCode', normalized);
    setRoomCode(normalized);
    setRoomVerified(true);
    setError('');
  }

  if (!roomVerified) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <p className="mt-2 text-white/60">
            교사가 안내한 방 코드를 입력하세요.
          </p>

          <input
            value={roomCode}
            onChange={(event) => {
              setRoomCode(event.target.value.toUpperCase());
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') verifyRoom();
            }}
            placeholder="방 코드"
            maxLength={6}
            className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 p-3 text-center text-2xl font-black tracking-[0.3em]"
          />

          {error && (
            <p className="mt-3 rounded-xl bg-red-500/20 p-3 text-center font-bold text-red-200">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={verifyRoom}
            className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg"
          >
            방 입장 확인
          </button>
        </section>
      </main>
    );
  }

  const team = joinedTeamName ? room.teams[joinedTeamName] : undefined;

  function joinTeam() {
    if (!room) return;

    const normalizedTeamName = teamName.trim();
    if (!normalizedTeamName) return;

    if (!room.teams[normalizedTeamName]) {
      room.teams[normalizedTeamName] = createTeam(
        normalizedTeamName,
        room.round
      );
    }

    localStorage.setItem('teamName', normalizedTeamName);
    localStorage.setItem('verifiedRoomCode', room.code);

    setJoinedTeamName(normalizedTeamName);
    saveRoom({ ...room });
  }

  if (!team) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-raven-panel/90 p-8">
          <div className="rounded-xl bg-raven-gold/15 p-3 text-center text-sm text-raven-gold">
            방 코드 확인 완료: <b>{room.code}</b>
          </div>

          <h1 className="mt-5 text-4xl font-black">조 이름 입력</h1>

          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') joinTeam();
            }}
            placeholder="예: 3조"
            className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 p-3"
          />

          <button
            type="button"
            onClick={joinTeam}
            className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg"
          >
            입장하기
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('verifiedRoomCode');
              setRoomVerified(false);
              setJoinedTeamName('');
            }}
            className="mt-3 w-full rounded-xl border border-white/20 p-2 text-sm text-white/60"
          >
            방 코드 다시 입력
          </button>
        </section>
      </main>
    );
  }

  function toggleCard(card: string) {
    if (!room || !team) return;

    if (
      ['submitted', 'complete', 'gameover', 'success'].includes(team.status)
    ) {
      return;
    }

    team.selected = team.selected.includes(card)
      ? team.selected.filter((item) => item !== card)
      : team.selected.length >= 6
        ? team.selected
        : [...team.selected, card];

    saveRoom({ ...room });
  }

  function submitExclusion() {
    if (!room || !team) return;
    if (team.selected.length !== 6) return;

    team.status = 'submitted';
    team.pending = {
      type: 'exclude',
      cards: team.selected
    };
    team.notice = '제출 완료: 교사 판정을 기다리세요.';

    saveRoom({ ...room });
  }

  function submitFinal(
    criminal: string,
    weapon: string,
    motive: string
  ) {
    if (!room || !team) return;

    if (!criminal || !weapon || !motive) {
      alert('범인, 도구, 동기를 모두 선택하세요.');
      return;
    }

    team.status = 'submitted';
    team.pending = {
      type: 'final',
      criminal,
      weapon,
      motive
    };
    team.notice = '최종 추리 제출 완료';

    saveRoom({ ...room });
  }

  return (
    <StudentBoard
      room={room}
      team={team}
      toggle={toggleCard}
      submit={submitExclusion}
      final={submitFinal}
    />
  );
}

function StudentBoard({
  room,
  team,
  toggle,
  submit,
  final
}: {
  room: Room;
  team: Team;
  toggle: (card: string) => void;
  submit: () => void;
  final: (criminal: string, weapon: string, motive: string) => void;
}) {
  return (
    <main className="min-h-screen p-4">
      <header className="mb-3 grid grid-cols-3 items-center">
        <div>
          <h1 className="text-4xl font-black">DYING MESSAGE</h1>
          <p className="text-white/60">소설가의 마지막 유언</p>
        </div>

        <div className="flex justify-center gap-3">
          <span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">
            {team.name}
          </span>
          <span className="rounded-full border border-white/30 bg-black/20 px-6 py-3 font-black">
            ROUND {team.round}
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-black">
            {team.status === 'thinking'
              ? '추리 중'
              : team.status === 'submitted'
                ? '판정 대기'
                : team.status === 'complete'
                  ? '라운드 완료'
                  : team.status === 'retry'
                    ? '재도전'
                    : team.status === 'success'
                      ? '사건 해결'
                      : 'GAME OVER'}
          </span>
        </div>

        <div className="justify-self-end rounded-2xl bg-black/20 px-5 py-3">
          선택 <b className="text-raven-green">{team.selected.length}</b>/6
        </div>
      </header>

      <ResultNotice team={team} />

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <section className="grid grid-rows-3 gap-3">
          {(['criminals', 'weapons', 'motives'] as Category[]).map(
            (category) => (
              <section
                key={category}
                className="rounded-3xl border border-white/15 bg-raven-panel/90 p-4"
              >
                <h2 className="mb-3 text-2xl font-black text-purple-200">
                  {category === 'criminals'
                    ? '범인'
                    : category === 'weapons'
                      ? '실행 도구'
                      : '범행 동기'}
                </h2>

                <div className="grid grid-cols-9 gap-2">
                  {room.candidates[category].map((card) => (
                    <Card
                      key={card}
                      name={card}
                      cat={category}
                      selected={team.selected.includes(card)}
                      excluded={team.excluded[category].includes(card)}
                      onClick={() => toggle(card)}
                    />
                  ))}
                </div>
              </section>
            )
          )}
        </section>

        <aside className="space-y-3">
          <section className="paper rounded-3xl p-5">
            <h2 className="text-center text-2xl font-black">공통 힌트</h2>

            {(['criminal', 'weapon', 'motive'] as const).map((key) => (
              <div key={key} className="border-b border-black/20 py-3">
                <b className="rounded-xl bg-purple-800 px-3 py-1 text-white">
                  {key === 'criminal'
                    ? '범인'
                    : key === 'weapon'
                      ? '도구'
                      : '동기'}
                </b>

                <div className="mt-2 flex flex-wrap gap-2">
                  {room.hints[key].map((tile) => (
                    <Chip
                      key={tile.id}
                      word={tile.word}
                      type={tile.type}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-white/15 bg-raven-panel/90 p-5">
            <div className="flex justify-center gap-2">
              {team.guessTiles.map((alive, index) => (
                <span
                  key={index}
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    alive ? 'bg-blue-600' : 'bg-red-600'
                  }`}
                >
                  {alive ? '✓' : '×'}
                </span>
              ))}
            </div>

            {room.round < 4 ? (
              <button
                type="button"
                disabled={
                  team.selected.length !== 6 ||
                  team.status === 'submitted' ||
                  team.status === 'complete'
                }
                onClick={submit}
                className="mt-4 w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg disabled:opacity-40"
              >
                제외 제출
              </button>
            ) : (
              <Final
                room={room}
                team={team}
                final={final}
              />
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

function Final({
  room,
  team,
  final
}: {
  room: Room;
  team: Team;
  final: (criminal: string, weapon: string, motive: string) => void;
}) {
  const [criminal, setCriminal] = useState('');
  const [weapon, setWeapon] = useState('');
  const [motive, setMotive] = useState('');

  return (
    <div className="mt-4 space-y-2">
      <select
        className="w-full rounded-xl bg-black/20 p-2"
        value={criminal}
        onChange={(event) => setCriminal(event.target.value)}
      >
        <option value="">범인</option>
        {room.candidates.criminals
          .filter(
            (item) => !team.excluded.criminals.includes(item)
          )
          .map((item) => (
            <option key={item}>{item}</option>
          ))}
      </select>

      <select
        className="w-full rounded-xl bg-black/20 p-2"
        value={weapon}
        onChange={(event) => setWeapon(event.target.value)}
      >
        <option value="">도구</option>
        {room.candidates.weapons
          .filter(
            (item) => !team.excluded.weapons.includes(item)
          )
          .map((item) => (
            <option key={item}>{item}</option>
          ))}
      </select>

      <select
        className="w-full rounded-xl bg-black/20 p-2"
        value={motive}
        onChange={(event) => setMotive(event.target.value)}
      >
        <option value="">동기</option>
        {room.candidates.motives
          .filter(
            (item) => !team.excluded.motives.includes(item)
          )
          .map((item) => (
            <option key={item}>{item}</option>
          ))}
      </select>

      <button
        type="button"
        onClick={() => final(criminal, weapon, motive)}
        className="w-full rounded-2xl bg-raven-gold p-3 font-black text-raven-bg"
      >
        최종 추리 제출
      </button>
    </div>
  );
}
