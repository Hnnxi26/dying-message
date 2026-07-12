# 화요일 시연용 실시간 버전

## 교체 방법
이 ZIP의 전체 내용을 GitHub 저장소에 덮어쓴 뒤 Commit/Push 하세요.
`node_modules`, `.next`, `.git`은 ZIP에 포함되지 않습니다.

## Firebase 필수 확인
1. Vercel 환경변수 6개가 등록되어 있어야 합니다.
2. 환경변수 수정 후 Redeploy 해야 합니다.
3. Firestore 테스트 규칙이 게시되어 있어야 합니다.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 리허설
1. 교사 기기에서 `/teacher` → 방 만들기
2. 학생 휴대폰/패드에서 QR 접속
3. 서로 다른 기기 2대 이상으로 조 입장
4. 힌트 공개 → 학생 화면 반영 확인
5. 학생 6장 선택·제출 → 교사 조 현황 확인
6. 교사 판정 → 학생 결과 모달 확인
7. 다음 라운드 및 최종 추리 확인

## 이번 버전 변경
- localStorage 게임 저장소를 Firestore 실시간 저장소로 교체
- 교사/학생/프로젝터가 `onSnapshot`으로 실시간 동기화
- 학생 입장과 카드 선택/제출을 Firestore transaction으로 처리
- 교사 힌트 편집/공개, 판정, 다음 라운드를 transaction으로 처리
- ROUND 4 최종 추리 복구
