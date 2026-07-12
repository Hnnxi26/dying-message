v0.9.5 고정 일러스트 카드 시스템

추가/교체 파일:
- lib/localGame.ts
- lib/cardArt.ts
- components/student/CandidateGrid.tsx
- app/teacher/page.tsx
- app/student/page.tsx
- app/projector/page.tsx
- public/cards/ASSET_MANIFEST.md

반영:
- 사건 브리핑 문구를 피해자가 남긴 메시지 설정으로 수정
- 조 순서를 1조, 2조, 3조 순으로 고정
- 범인 23장, 도구 23장, 동기 9장의 고정 이미지 경로 확정
- 학생 후보 카드를 일러스트 카드 레이아웃으로 변경
- 이미지가 없는 동안에도 아이콘 대체 화면으로 정상 동작
- 이미지를 public/cards 폴더에 추가하면 코드 수정 없이 자동 표시
- ROUND 표시는 기존처럼 학생 화면 상단에 계속 유지
