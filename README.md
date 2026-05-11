# match-picture-app

Unity 원본 같은그림찾기 게임을 Apps in Toss WebView/Granite 기반 미니앱으로 포팅한 프로젝트입니다.

## 개발 시작하기

```bash
npm install
npm run dev
```

`npm run dev`는 Granite 개발 서버를 실행합니다. 일반 브라우저에서도 게임 자체는 동작하며, Apps in Toss 브릿지(Storage, leaderboard, requestReview 등)는 토스 앱 또는 샌드박스 앱에 연결했을 때만 정상 동작합니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Granite 개발 서버 실행 |
| `npm test` | Vitest로 게임 핵심 로직 (Deck 알고리즘 / 게임 룰) 검증 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 일괄 적용 |
| `npm run build` | Apps in Toss CLI(`ait build`)로 배포 번들 생성 |
| `npm run deploy` | 배포 번들 업로드 |

## 환경 변수

| 키 | 설명 |
| --- | --- |
| `VITE_AD_GROUP_ID` | Apps in Toss 통합 광고(전면형) 그룹 ID. 없으면 광고 노출이 비활성화됩니다. |
| `VITE_ENABLE_LEADERBOARD` | `true`이면 결과 화면에 `RANKING` 버튼을 표시하고 게임 클리어 시 리더보드에 점수를 제출합니다. |

## 폴더 구조

```
src/
  App.tsx              게임 화면 셸 + 모달 + 네이티브 연동
  components/          카드 UI, HUD, 모달 등 프레젠테이션 컴포넌트
  game/                Deck 알고리즘 / 게임 룰 / React 상태 훅 + 단위 테스트
  ait/                 Apps in Toss 브릿지 어댑터(스토리지, 리더보드, 리뷰 등)
public/symbols/        Unity Resources/NotoEmoji에서 가져온 심볼 PNG
```

## 참고 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
