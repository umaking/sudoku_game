# Sudoku Lab — 변형 스도쿠

표준 1~9 스도쿠와 두 가지 변형(Parity / Sum-Diff)을 한 게임에서 즐기는 React + TypeScript PWA.

- **Classic** — 표준 9×9, 행/열/3×3 박스 distinct
- **Parity** — 일부 셀이 짝수만/홀수만 허용 (셀 배경 색으로 표시)
- **Sum-Diff** — 두 인접 셀 사이 라벨(`+N` 합 또는 `−N` 차)이 강제 제약

리포지토리: https://github.com/umaking/sudoku_game

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| Frontend | React 18, TypeScript 5.6 (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) |
| 빌드 | Vite 5, vite-plugin-pwa, Workbox |
| 상태 관리 | Zustand 4 (5 slices: board / history / settings / gameSession / stats) |
| 렌더링 | SVG 시각 레이어 + 투명 DOM 인터랙션 레이어 하이브리드 |
| 사운드 | Web Audio API (절차적 톤, 외부 자산 0개) |
| 단위 테스트 | Vitest 2 + jsdom + @testing-library/react |
| e2e 테스트 | Playwright (Chromium headless) |
| 린트 / 포맷 | ESLint 9 (flat config) + typescript-eslint, Prettier |

외부 사운드 / 아이콘 / 폰트 자산 없음. 빌드 산출물은 약 200KB(JS) + 17KB(CSS) gzipped.

---

## 사전 요구

- **Node.js 18+** (권장 20+)
- **npm 9+**

---

## 시작하기

```bash
git clone https://github.com/umaking/sudoku_game.git
cd sudoku_game
npm install
npm run dev
# → http://localhost:5173
```

Playwright e2e를 실행하려면 처음에 한 번 브라우저 설치 필요:

```bash
npm run test:e2e:install   # chromium 다운로드
npm run test:e2e
```

---

## 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (Vite, HMR) |
| `npm run build` | 프로덕션 빌드 (`tsc -b && vite build`) |
| `npm run preview` | 빌드 결과 로컬 프리뷰 (PWA SW 활성) |
| `npm test` | Vitest 단위 테스트 단발 실행 |
| `npm run test:watch` | Vitest 워치 모드 |
| `npm run test:ui` | Vitest UI |
| `npm run test:e2e` | Playwright e2e (자동으로 dev 서버 띄움) |
| `npm run test:e2e:install` | Playwright Chromium 설치 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier 자동 포맷 |
| `npm run ci` | typecheck + lint + 단위 테스트 일괄 실행 |

---

## 프로젝트 구조

```
src/
├── core/                          # 순수 함수 (React 의존 0, ESLint로 강제)
│   ├── types.ts                   # Cell, Region, Constraint, Board, Move, ...
│   ├── coords.ts                  # 좌표/박스/이웃 헬퍼
│   ├── board.ts                   # 보드 생성/복제/직렬화 + 비트마스크 유틸
│   └── engine/
│       ├── solver.ts              # 백트래킹 솔버 (MRV + 비트마스크)
│       ├── uniqueness.ts          # 유일해 검증기 (max 2 solutions)
│       ├── generator.ts           # Classic/Parity/Sum-Diff 생성기 (mulberry32 PRNG)
│       ├── parity.ts              # parity 마스크 헬퍼 + applyParityMasks
│       └── sumDiff.ts             # 엣지 제약 빌더 + 인접쌍 헬퍼
├── variants/                      # 변형 레지스트리 + 매니페스트
│   ├── types.ts                   # VariantManifest, VariantAdapter, TutorialStep
│   ├── registry.ts                # registerVariant / listVariants
│   ├── classic.ts | parity.ts | sumDiff.ts
├── state/                         # Zustand 스토어
│   ├── store.ts                   # 5 slices 합성 + persist 미들웨어 (version 3)
│   ├── persistence.ts
│   └── slices/
│       ├── boardSlice.ts          # board, selectedIdx, pencilMode, setDigit, ...
│       ├── historySlice.ts        # undo/redo 커맨드 스택
│       ├── settingsSlice.ts       # theme, colorBlind, fontScale, sound, ...
│       ├── gameSessionSlice.ts    # 타이머, 실수, finishSession
│       └── statsSlice.ts          # PB / 완료 횟수 (per variant × difficulty)
├── ui/                            # React 컴포넌트
│   ├── pages/GamePage.tsx         # 메인 진입점
│   ├── components/
│   │   ├── Grid/                  # SVG 시각 + DOM 인터랙션 9×9
│   │   ├── NumberPad/             # 1-9 + 메모/지우기/undo/redo
│   │   ├── TopBar/                # 변형 picker, 타이머, 실수, 모달 트리거
│   │   ├── VariantPicker/
│   │   ├── Modal/                 # 공용 (createPortal + Esc + bottom-sheet)
│   │   ├── ResultScreen/          # 완료 시 PB 표시
│   │   ├── HowToPlay/             # 변형별 룰 패널 (mini-markdown)
│   │   ├── Tutorial/              # 인터랙티브 단계 + MiniBoard
│   │   ├── SettingsModal/         # 테마/색맹/글꼴/사운드 등
│   │   └── StatsModal/            # 변형 × 난이도 표
│   ├── hooks/                     # useNewGame, useTimer, useKeyboardNav,
│   │                              # useLongPress, useSudokuFx, useFinishDetector, ...
│   ├── audio/soundEngine.ts       # Web Audio 절차적 톤
│   └── tokens/tokens.css          # 디자인 토큰 (라이트/다크/색맹)
├── test/golden.test.ts            # M1~M3 통합 골든 테스트
└── main.tsx                       # 부트스트랩 (variant 등록 + SW 등록)

playwright/e2e/golden.spec.ts      # Playwright e2e
public/                            # PWA 아이콘 (SVG)
```

---

## 핵심 설계 결정

- **`src/core`는 React 의존 금지** — ESLint `no-restricted-imports`로 강제. 순수 함수만 두어 솔버를 워커화하거나 다른 환경에 재사용하기 쉬움.
- **VariantManifest + VariantAdapter** — 새 변형 추가 시 매니페스트 한 개 작성하면 UI/메뉴/통계/튜토리얼이 모두 자동 노출. 코어 솔버는 변형을 모름.
- **숫자 도메인을 `size`로 매개변수화** — 9 하드코딩 금지. 향후 16×16 헥사 같은 도메인 확장 대비.
- **Candidates는 코어에서 9비트 마스크**, UI 경계에서만 Set/배열로 변환 → 솔버 핫패스 성능 확보.
- **Parity는 `allowedSet` 마스크로 도메인 축소** — 솔버는 parity 룰을 알 필요 없이 셀별 candidates만 보면 동작.
- **Sum-Diff는 엣지별 `Constraint` 객체** — `adapter.buildConstraints(board)`로 솔버 옵션에 주입.
- **SVG + DOM 하이브리드 렌더링** — 시각은 SVG(vector zoom + 비정형 그래픽), 인터랙션은 절대 위치 DOM `<button role="gridcell">` 81개로 a11y/키보드 자연스럽게.
- **Persist 마이그레이션** — v1 → v2(stats 추가) → v3(sound 추가). 사용자 데이터 무손실 업그레이드.

---

## 주요 기능

### 게임플레이
- 마우스 / 터치 / 키보드 입력
- 키보드: 화살표(이동), 1-9(입력), Shift+1-9(메모), Backspace(지우기), Z/Y(undo/redo), M(메모 모드), Esc(선택 해제)
- 모바일 **롱프레스 500ms** → 메모 모드 토글 + `navigator.vibrate(10)` 햅틱
- 충돌 시각 (행/열/박스 distinct + parity 위반 + sum/diff 위반)
- 자동 풀이 완료 감지 → ResultScreen 자동 표시

### 사운드
- 입력(triangle 660Hz) / 지우기(sine 320Hz) / 메모(sine 880Hz)
- **한 줄(행·열·박스) 완성 차임** — C5–E5–G5 아르페지오
- Settings에서 on/off

### 시각 효과
- 한 줄 완성 시 9셀 동시 fill flash (0.8s, ease-out)
- `prefers-reduced-motion` 존중

### 접근성
- 라이트 / 다크 / 시스템 테마 (빠른 토글 + Settings 풀 옵션)
- **색맹 모드** — parity / error 토큰을 청·주황 축으로 재정의 (적·녹 색약 안전)
- 글꼴 크기 3단계 (Sm 1× / Md 1.15× / Lg 1.3×)
- 키보드만으로 게임 완주 가능
- ARIA labels / `aria-pressed` / `aria-modal`

### 통계 / 학습
- 변형 × 난이도별 PB / 완료 횟수 / 누적 실수 (localStorage 영속)
- **인터랙티브 튜토리얼** — 변형별 3~4 단계, MiniBoard에서 직접 풀어보기
- HowToPlay 모달 (룰 마크다운)

### PWA
- `manifest.webmanifest` 로 설치 가능
- Workbox 오프라인 캐시
- SW autoUpdate
- dev 모드는 SW 비활성(HMR/E2E 안정성)

---

## 테스트

```bash
npm run ci         # typecheck + lint + 207 단위 테스트 (~2.5s)
npm run test:e2e   # Playwright 3 e2e 시나리오 (~4s)
```

- **단위 / 컴포넌트**: 26 파일 / 207 테스트
- **e2e**: 페이지 로드 + 81셀 / 입력+undo / 변형 전환

---

## 라이선스

[LICENSE](./LICENSE)
