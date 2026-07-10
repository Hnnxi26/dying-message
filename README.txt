v0.8 프로젝트 리팩터링 패치

추가/교체 파일:
- app/teacher/page.tsx
- app/student/page.tsx
- components/common/HintChip.tsx
- components/teacher/CandidatePanel.tsx
- components/teacher/HintEditor.tsx
- components/teacher/TeamStatusCard.tsx
- components/student/CandidateGrid.tsx
- components/student/HintNotebook.tsx
- components/student/ResultModal.tsx
- hooks/useHintDraft.ts
- lib/localGame.ts
- lib/localStore.ts

핵심:
- 기존 기능을 컴포넌트와 훅으로 분리
- 교사 페이지와 학생 페이지 길이 축소
- 이후 타이머/프로젝터/Firebase 연결을 쉽게 추가할 수 있는 구조
- 현재 localStorage 방식은 그대로 유지
