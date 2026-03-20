# 개발 실행 계획 (프론트/백엔드 병렬 개발)

## 전체 구조

각 Sprint는 **프론트엔드(FE)**와 **백엔드(BE)** 작업을 병렬로 진행하며, Sprint 끝에 **체크포인트**에서 통합 테스트를 수행합니다.

```
Sprint 0 ──→ Sprint 1 ──→ Sprint 2 ──→ Sprint 3 ──→ Sprint 4 ──→ Sprint 5 ──→ Sprint 6
프로젝트셋업   인증 연동    스케줄+      시퀀스 생성   강사 대시보드  알림+자동화    폴리싱
              로그인/가입   컨디션 체크   E2E 연결     시퀀스 편집   히스토리      배포 준비
```

---

## Sprint 0: 프로젝트 스캐폴딩

> 모든 개발의 기초. FE/BE 프로젝트 구조를 만들고 연결 확인.

### BE 작업
| # | 작업 | 파일 |
|---|---|---|
| BE-0-1 | Hono + TypeScript 프로젝트 초기화 | `server/package.json`, `server/tsconfig.json` |
| BE-0-2 | Docker PostgreSQL 연결 확인 | `server/src/db/index.ts` |
| BE-0-3 | Drizzle ORM 설정 + config | `server/drizzle.config.ts` |
| BE-0-4 | `GET /health` 엔드포인트 | `server/src/index.ts` |
| BE-0-5 | 환경변수 구조 | `server/.env.example` |

### FE 작업
| # | 작업 | 파일 |
|---|---|---|
| FE-0-1 | Expo 프로젝트 초기화 (expo-router) | `package.json`, `app.json` |
| FE-0-2 | NativeWind v4 설정 | `tailwind.config.js`, `babel.config.js`, `metro.config.js`, `global.css` |
| FE-0-3 | 디렉토리 구조 생성 | `app/`, `components/`, `lib/` |
| FE-0-4 | 공유 타입 정의 | `shared/types.ts` |
| FE-0-5 | API 클라이언트 기초 | `lib/api/client.ts` |
| FE-0-6 | `.env` 설정 | `EXPO_PUBLIC_API_URL` |

### 체크포인트 ✅
```
□ BE: GET /health → { status: "ok" } 응답 확인
□ FE: 에뮬레이터에서 기본 화면 렌더링 확인
□ FE → BE: API 클라이언트에서 /health 호출 성공 확인
□ DB: Docker PostgreSQL 연결 + pilates DB 생성 확인
```

---

## Sprint 1: 인증 + 회원 프로필

> 로그인/회원가입 + 회원 CRUD. FE/BE가 처음으로 완전히 연동되는 Sprint.

### BE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| BE-1-1 | users, members 스키마 | `server/src/db/schema.ts` | passwordHash 포함 |
| BE-1-2 | 마이그레이션 실행 | `drizzle-kit push` | |
| BE-1-3 | JWT 유틸리티 | `server/src/lib/jwt.ts` | generateAccessToken, generateRefreshToken, verifyToken |
| BE-1-4 | bcrypt 유틸리티 | `server/src/lib/password.ts` | hashPassword, verifyPassword |
| BE-1-5 | 인증 API | `server/src/routes/auth.ts` | register, login, refresh, me, push-token |
| BE-1-6 | 인증 미들웨어 | `server/src/middleware/auth.ts` | authMiddleware, requireRole |
| BE-1-7 | 회원 CRUD API | `server/src/routes/members.ts` | GET/POST/PUT/DELETE |
| BE-1-8 | Zod 검증 스키마 | `shared/validation.ts` | 프론트/백 공유 |

### FE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| FE-1-1 | AuthProvider + Zustand | `lib/stores/authStore.ts` | 토큰 저장 (expo-secure-store) |
| FE-1-2 | 루트 레이아웃 | `app/_layout.tsx` | 인증 체크 → 역할별 리다이렉트 |
| FE-1-3 | 로그인 화면 | `app/(auth)/login.tsx` | 이메일/비밀번호 폼 |
| FE-1-4 | 회원가입 화면 | `app/(auth)/register.tsx` | 기본정보 + 역할선택 |
| FE-1-5 | 강사 탭 레이아웃 | `app/(instructor)/_layout.tsx` | 5탭 (홈/회원/스케줄/세션/설정) |
| FE-1-6 | 회원 탭 레이아웃 | `app/(member)/_layout.tsx` | 4탭 (오늘/컨디션/기록/프로필) |
| FE-1-7 | 회원 목록 화면 (강사) | `app/(instructor)/members/index.tsx` | 검색 + 목록 |
| FE-1-8 | 회원 등록/편집 폼 | `app/(instructor)/member-form.tsx` | RHF + Zod |
| FE-1-9 | 회원 상세 화면 (강사) | `app/(instructor)/members/[id].tsx` | 프로필 표시 |
| FE-1-10 | 프로필 화면 (회원) | `app/(member)/profile.tsx` | 내 정보 조회/편집 |
| FE-1-11 | UI 기본 컴포넌트 | `components/ui/` | Button, Card, Input, Badge, LoadingSpinner |

### 체크포인트 ✅
```
□ 회원가입 (강사) → 로그인 → 강사 탭 표시
□ 회원가입 (회원) → 로그인 → 회원 탭 표시
□ 강사: 회원 등록 → 목록에서 확인 → 상세 보기
□ 강사: 회원 정보 수정 → 저장 → 반영 확인
□ 회원: 프로필 조회 → 수정 → 저장 확인
□ JWT 만료 → refresh 토큰으로 갱신 확인
□ 잘못된 역할로 접근 시 403 에러 확인
```

---

## Sprint 2: 주간 스케줄 + 컨디션 분석

> 두 개의 독립적 기능을 병렬 개발. 스케줄(강사) + 컨디션 체크(회원).

### BE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| BE-2-1 | weeklySchedules 스키마 | `server/src/db/schema.ts` | + 마이그레이션 |
| BE-2-2 | 스케줄 CRUD API | `server/src/routes/schedules.ts` | CRUD + GET /today |
| BE-2-3 | sessions 스키마 | `server/src/db/schema.ts` | conditionAiRaw, conditionFinal, memberNote |
| BE-2-4 | Claude Vision 서비스 | `server/src/services/claude-vision.ts` | 컨디션 분석 전용 |
| BE-2-5 | conditionMapper | `server/src/services/conditionMapper.ts` | Vision 응답 → 앱 모델 |
| BE-2-6 | 컨디션 분석 API | `server/src/routes/condition.ts` | POST /condition/analyze |
| BE-2-7 | 컨디션 등록 API | `server/src/routes/condition.ts` | POST /condition/register |

### FE 작업 - 스케줄 (강사)
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| FE-2-1 | 주간 스케줄 화면 | `app/(instructor)/schedule.tsx` | 요일 탭 + 시간 목록 |
| FE-2-2 | WeeklySchedule 컴포넌트 | `components/schedule/WeeklySchedule.tsx` | 요일별 뷰 |
| FE-2-3 | ScheduleEditor 컴포넌트 | `components/schedule/ScheduleEditor.tsx` | 등록/편집 모달 |
| FE-2-4 | 스케줄 API 훅 | `lib/hooks/useSchedule.ts` | TanStack Query |

### FE 작업 - 컨디션 체크 (회원)
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| FE-2-5 | FaceCapture 컴포넌트 | `components/camera/FaceCapture.tsx` | expo-camera + base64 |
| FE-2-6 | ConditionResult 컴포넌트 | `components/condition/ConditionResult.tsx` | AI 결과 표시 |
| FE-2-7 | ConditionEditor 컴포넌트 | `components/condition/ConditionEditor.tsx` | 슬라이더/선택지 수정 |
| FE-2-8 | ConditionBadge 컴포넌트 | `components/condition/ConditionBadge.tsx` | 에너지/무드/수면 뱃지 |
| FE-2-9 | Slider 컴포넌트 | `components/ui/Slider.tsx` | 커스텀 슬라이더 |
| FE-2-10 | 컨디션 체크 화면 | `app/(member)/condition-check.tsx` | 카메라→분석→수정→등록 |
| FE-2-11 | 컨디션 API 훅 | `lib/hooks/useCondition.ts` | TanStack Query |

### 체크포인트 ✅
```
□ 강사: 주간 스케줄 등록 (월/수/금 10:00) → 요일별 확인
□ 강사: 스케줄 수정/삭제 → 반영 확인
□ 강사: GET /schedules/today → 오늘 수업 회원 목록
□ 회원: 카메라 촬영 → Claude Vision → 컨디션 분석 결과 표시
□ 회원: 에너지/무드/스트레스/수면 슬라이더로 수정
□ 회원: 추가 메모 입력 ("어깨 뻐근")
□ 회원: [등록] → DB에 conditionAiRaw + conditionFinal 모두 저장 확인
□ 컨디션 분석에 confidence score 포함 확인
```

---

## Sprint 3: LLM 시퀀스 생성 + E2E 연결

> 핵심 기능 완성. 컨디션 → 시퀀스 생성 → 오늘의 시퀀스 확인까지 전체 파이프라인.

### BE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| BE-3-1 | exerciseSequences 스키마 | `server/src/db/schema.ts` | + 마이그레이션 |
| BE-3-2 | exerciseCatalog 스키마 + 시드 | `server/src/db/schema.ts`, `server/src/db/seed.ts` | 필라테스 운동 50개+ |
| BE-3-3 | Claude Text API 서비스 | `server/src/services/claude-text.ts` | SDK 연동 |
| BE-3-4 | 시퀀스 생성 서비스 | `server/src/services/sequence-generator.ts` | 프롬프트 구성 + JSON 파싱 |
| BE-3-5 | 세션 CRUD API | `server/src/routes/sessions.ts` | POST/GET/PUT |
| BE-3-6 | 시퀀스 생성 API | `server/src/routes/sequences.ts` | POST /sequences/generate |
| BE-3-7 | 시퀀스 수정 API | `server/src/routes/sequences.ts` | PUT /sequences/:id |
| BE-3-8 | 운동 카탈로그 API | `server/src/routes/exercises.ts` | GET/POST |

### FE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| FE-3-1 | CategorySelector 컴포넌트 | `components/exercise/CategorySelector.tsx` | 운동 카테고리 선택 (최대 2개) |
| FE-3-2 | 컨디션 등록 → 카테고리 → 시퀀스 생성 연결 | `app/(member)/condition-check.tsx` 수정 | 전체 플로우 연결 |
| FE-3-3 | 오늘의 시퀀스 화면 | `app/(member)/today.tsx` | 시퀀스 표시 + 미배정 상태 |
| FE-3-4 | SequenceCard 컴포넌트 | `components/exercise/SequenceCard.tsx` | 시퀀스 요약 카드 |
| FE-3-5 | ExerciseItem 컴포넌트 | `components/exercise/ExerciseItem.tsx` | 개별 운동 카드 |
| FE-3-6 | 운동 상세 모달 | `app/(member)/exercise-detail.tsx` | 설명, 수정사항, 이유 |
| FE-3-7 | 시퀀스 API 훅 | `lib/hooks/useSequence.ts` | TanStack Query |
| FE-3-8 | 시퀀스 생성 로딩 UI | 프로그레스 바 / 스피너 | 10초 대기 UX |

### 체크포인트 ✅ (핵심 E2E)
```
□ 전체 E2E: 카메라촬영 → 컨디션분석 → 수정 → 카테고리선택 → 시퀀스생성 → 오늘탭 확인
□ 시퀀스에 운동명, 시간, 세트, 기구, 이유 모두 포함 확인
□ 신체 금기 운동이 시퀀스에 미포함 확인 (측만증 회원 → 금기 운동 제외)
□ 수면 부족(POOR) → 고강도 운동 제외 확인
□ 안면 근긴장 → 이완 운동 추가 확인
□ 회원 메모 ("어깨 뻐근") → 시퀀스에 반영 확인
□ 카테고리 선택 ("코어", "유연성") → 시퀀스에 반영 확인
□ 컨디션 미체크 시 → 프로필만으로 시퀀스 생성 가능 확인
□ 시퀀스 생성 로딩 UX 확인 (10초 이내)
```

---

## Sprint 4: 강사 대시보드 + 시퀀스 편집

> 강사 측 핵심 기능. 대시보드에서 오늘 현황 확인 + 시퀀스 리뷰/수정.

### BE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| BE-4-1 | 대시보드용 통합 조회 API | `server/src/routes/sessions.ts` | 오늘 스케줄 기반 세션 + 컨디션 + 시퀀스 통합 |
| BE-4-2 | 시퀀스 수정 API 보완 | `server/src/routes/sequences.ts` | wasModified 플래그, 운동 추가/삭제 |
| BE-4-3 | 운동 카탈로그 검색 API | `server/src/routes/exercises.ts` | 카테고리/난이도/기구/검색 필터 |

### FE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| FE-4-1 | 대시보드 화면 | `app/(instructor)/dashboard.tsx` | 오늘 현황 요약 + 세션 목록 |
| FE-4-2 | SessionStatusCard | `components/dashboard/SessionStatusCard.tsx` | 생성완료/미체크/자동생성 상태 |
| FE-4-3 | ConditionSummary | `components/dashboard/ConditionSummary.tsx` | 체크 현황 요약 |
| FE-4-4 | 시퀀스 리뷰 화면 | `app/(instructor)/review.tsx` | 운동 목록 + 컨디션 정보 |
| FE-4-5 | SequenceEditor | `components/exercise/SequenceEditor.tsx` | 드래그앤드롭 순서 변경 |
| FE-4-6 | 운동 추가 모달 | 카탈로그 검색 → 선택 → 추가 | |
| FE-4-7 | 운동 인라인 편집 | 세트/횟수/시간 수정 | |

### 체크포인트 ✅
```
□ 강사: 대시보드에서 오늘 세션 현황 확인 (스케줄 기반)
□ 강사: 컨디션 체크 완료/미완료 회원 구분 확인
□ 강사: 회원 메모 ("어깨 뻐근") 대시보드에서 확인
□ 강사: 시퀀스 카드 탭 → 리뷰 화면 진입
□ 강사: 운동 순서 드래그 변경 → 저장 → 반영
□ 강사: 운동 추가 (카탈로그 검색) → 저장
□ 강사: 운동 삭제 → 저장
□ 강사: 세트/횟수/시간 수정 → 저장
□ 수정된 시퀀스가 회원 앱에 즉시 반영 확인
```

---

## Sprint 5: 알림 + 자동 생성 + 히스토리

> 자동화 기능 완성. Push 알림 + 크론잡 + 히스토리 뷰.

### BE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| BE-5-1 | Push 알림 서비스 | `server/src/services/push-notification.ts` | expo-server-sdk |
| BE-5-2 | 12시 리마인더 크론잡 | `server/src/jobs/condition-reminder.ts` | 미체크 회원 push |
| BE-5-3 | 1시 자동 시퀀스 생성 크론잡 | `server/src/jobs/auto-sequence.ts` | 미체크 회원 자동 생성 |
| BE-5-4 | 컨디션 체크 마감 처리 | `server/src/routes/condition.ts` | 1시 이후 요청 거부 |
| BE-5-5 | 히스토리 API | `server/src/routes/sessions.ts` | 날짜별 과거 세션 목록 |
| BE-5-6 | 세션 완료 API | `server/src/routes/sessions.ts` | PUT status → completed |

### FE 작업
| # | 작업 | 파일 | 상세 |
|---|---|---|---|
| FE-5-1 | Push 알림 설정 | `lib/hooks/useNotifications.ts` | 토큰 등록, 알림 수신 |
| FE-5-2 | 알림 탭 응답 처리 | 알림 탭 → 해당 화면 이동 | |
| FE-5-3 | 컨디션 마감 화면 | `app/(member)/condition-check.tsx` 수정 | 1시 이후 마감 안내 |
| FE-5-4 | 자동 생성 뱃지 | `components/exercise/` 수정 | isAutoGenerated 표시 |
| FE-5-5 | 히스토리 화면 (회원) | `app/(member)/history.tsx` | 날짜별 과거 세션 |
| FE-5-6 | 세션 히스토리 (강사) | `app/(instructor)/sessions.tsx` | 전체 세션 목록 + 필터 |
| FE-5-7 | 운동 상세 화면 보완 | `app/(member)/exercise-detail.tsx` | 설명, 수정사항 표시 |

### 체크포인트 ✅
```
□ 12시 크론잡 → 미체크 회원에게 push 알림 수신 확인
□ 1시 크론잡 → 미체크 회원 자동 시퀀스 생성 확인
□ 자동 생성된 시퀀스에 isAutoGenerated 뱃지 표시
□ 1시 이후 컨디션 체크 시도 → 마감 안내 화면
□ 강사 시퀀스 수정 → 회원에게 push 알림
□ 회원: 히스토리에서 과거 세션 목록 확인
□ 강사: 세션 히스토리에서 날짜/회원 필터 확인
□ 강사: 세션 상태 completed 변경 확인
```

---

## Sprint 6: 폴리싱 + 배포 준비

> 프로덕션 품질 향상 및 배포.

### 작업 (FE + BE 통합)
| # | 작업 | 상세 |
|---|---|---|
| 6-1 | 에러 처리 통일 | FE: 전역 에러 바운더리, BE: 통일 에러 형식 |
| 6-2 | 로딩 상태 개선 | 스켈레톤 UI, 프로그레스 바 |
| 6-3 | 오프라인 폴백 | TanStack Query 오프라인 캐시 |
| 6-4 | API 레이트 리밋 | 컨디션 체크 API 제한 |
| 6-5 | 앱 아이콘 + 스플래시 | 디자인 적용 |
| 6-6 | 온보딩 플로우 | 최초 실행 안내 (3-4 슬라이드) |
| 6-7 | 성능 최적화 | 이미지 압축, 리스트 가상화, 메모이제이션 |
| 6-8 | 백엔드 Railway 배포 | 환경변수, 도메인, PostgreSQL 연결 |
| 6-9 | EAS Build | iOS/Android 빌드 프로파일, 서명 키 |
| 6-10 | 테스트 배포 | TestFlight / Internal Testing |

### 최종 체크포인트 ✅
```
□ 전체 E2E 플로우 (회원): 가입 → 로그인 → 컨디션 → 시퀀스 → 히스토리
□ 전체 E2E 플로우 (강사): 로그인 → 회원등록 → 스케줄 → 대시보드 → 리뷰 → 수정
□ 자동화: 12시 알림 → 1시 자동 생성 → 배정 완료
□ 에러 상황: API 실패, 네트워크 끊김, 토큰 만료 → 적절한 피드백
□ 오프라인: 마지막 시퀀스 캐시 표시
□ 성능: 컨디션 분석 5초 이내, 시퀀스 생성 10초 이내
□ TestFlight / Internal Testing 배포 완료
```

---

## Sprint별 의존성 다이어그램

```
Sprint 0 (스캐폴딩)
    │
    ▼
Sprint 1 (인증 + 프로필)
    │
    ├────────────────────┐
    ▼                    ▼
Sprint 2-A (스케줄)   Sprint 2-B (컨디션)
    │                    │
    └────────┬───────────┘
             ▼
    Sprint 3 (시퀀스 생성 + E2E)
             │
             ▼
    Sprint 4 (강사 대시보드)
             │
             ▼
    Sprint 5 (알림 + 자동화)
             │
             ▼
    Sprint 6 (폴리싱 + 배포)
```

> Sprint 2의 스케줄(강사)과 컨디션(회원)은 서로 독립적이므로 완전히 병렬 개발 가능.

---

## 각 Sprint 시작 전 준비사항

| Sprint | 필요한 외부 설정 |
|---|---|
| 0 | Docker PostgreSQL 실행 확인, pilates DB 생성 |
| 1 | 없음 (내부 구현) |
| 2 | Anthropic API 키 발급 (`ANTHROPIC_API_KEY`) |
| 3 | 없음 (Sprint 2의 API 키 재사용) |
| 4 | 없음 |
| 5 | Expo Push 설정 (`EXPO_ACCESS_TOKEN`) |
| 6 | Railway 계정, Expo EAS 계정 |

---

## 개발 시 규칙

### Git 브랜치 전략
```
main ← 안정 버전
  └── develop ← 개발 통합
        ├── feature/sprint-1-auth
        ├── feature/sprint-2-schedule
        ├── feature/sprint-2-condition
        └── ...
```

### 각 Sprint 완료 시
1. 체크포인트 항목 전체 확인
2. develop에 merge
3. 커밋 메시지에 Sprint 번호 포함
4. 발견된 이슈는 다음 Sprint 시작 시 우선 수정

### FE/BE 연동 규칙
- API 엔드포인트는 `shared/types.ts`의 타입을 공유
- BE API 완성 전 FE는 mock 데이터로 UI 개발 가능
- BE API 완성 후 mock → 실제 API로 교체
- 연동 테스트는 체크포인트에서 일괄 수행
