# 개발 로드맵 및 마일스톤

## 전체 타임라인 개요

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6
스캐폴딩    인증+프로필  스케줄+컨디션  시퀀스생성   강사리뷰    회원뷰+자동화  폴리싱
```

---

## Phase 0: 프로젝트 스캐폴딩 ✅ 완료

### 목표
개발 환경 구축 및 프로젝트 기초 세팅

### 작업 항목

| # | 작업 | 상세 |
|---|---|---|
| 0-1 | Expo 프로젝트 초기화 | `npx create-expo-app` + expo-router 설정 |
| 0-2 | NativeWind 설정 | Tailwind CSS for RN 세팅 |
| 0-3 | 서버 프로젝트 초기화 | Hono + TypeScript + nodemon |
| 0-4 | Drizzle ORM 설정 | Docker PostgreSQL 연결 + 마이그레이션 구조 |
| 0-5 | Docker PostgreSQL 연결 확인 | 기존 Docker PostgreSQL에 pilates DB 생성 |
| 0-6 | 환경변수 구조 | `.env.example` 작성 |
| 0-7 | 공유 타입 정의 | `shared/types.ts` 기초 타입 |
| 0-8 | 기본 프로젝트 구조 생성 | 디렉토리 + placeholder 파일 |

### 완료 기준
- Expo dev 서버 실행 → 에뮬레이터 기본 화면
- 백엔드 `GET /health` 응답 확인
- DB 연결 확인

---

## Phase 1: 인증 + 회원 프로필 ✅ 완료

### 목표
사용자 인증과 회원 프로필 CRUD 완성

### 작업 항목

| # | 작업 | 상세 |
|---|---|---|
| 1-1 | DB 스키마 | users, members 테이블 |
| 1-2 | 마이그레이션 실행 | `drizzle-kit push` |
| 1-3 | 인증 API | register(bcrypt해싱), login(JWT발급), me, push-token |
| 1-4 | 인증 미들웨어 | JWT 검증 + roleGuard |
| 1-5 | 회원 CRUD API | GET/POST/PUT/DELETE /members |
| 1-6 | 로그인 화면 | 이메일/비밀번호 |
| 1-7 | 회원가입 화면 | 기본 정보 + 역할 선택 (얼굴 등록 없음) |
| 1-8 | 인증 상태 관리 | Zustand authStore + expo-secure-store |
| 1-9 | 역할별 라우팅 | instructor/member 탭 분기 |
| 1-10 | 회원 목록/상세/등록 (강사) | 검색, 페이지네이션 |
| 1-11 | 프로필 화면 (회원) | 내 정보 조회/편집 |

### 완료 기준
- 강사 로그인 → 회원 생성 → 목록 확인
- 회원 로그인 → 프로필 조회/편집
- 역할별 다른 탭 표시

### 의존성
- Phase 0 완료

---

## Phase 2: 주간 스케줄 + 컨디션 분석 ✅ 완료

### 목표
주간 수업 스케줄 관리, 카메라 기반 컨디션 분석 (본인 확인 없이), 회원의 분석 결과 수정 기능

### 작업 항목

| # | 작업 | 상세 |
|---|---|---|
| 2-1 | weeklySchedules 스키마 | Drizzle 스키마 + 마이그레이션 |
| 2-2 | 스케줄 CRUD API | GET/POST/PUT/DELETE /schedules, GET /schedules/today |
| 2-3 | 주간 스케줄 화면 (강사) | 요일별 스케줄 등록/편집/삭제 |
| 2-4 | WeeklySchedule, ScheduleEditor 컴포넌트 | 스케줄 UI |
| 2-5 | Claude Vision 서비스 | claude-vision.ts: 컨디션 분석 전용 (본인 확인 없음) |
| 2-6 | 컨디션 분석 API | POST /condition/analyze (사진 → AI 분석 결과) |
| 2-7 | 컨디션 등록 API | POST /condition/register (회원 수정본 + 메모 저장) |
| 2-8 | conditionMapper 구현 | Claude Vision 응답 → 앱 컨디션 모델 변환 |
| 2-9 | FaceCapture 컴포넌트 | expo-camera + 얼굴 가이드 + base64 캡처 |
| 2-10 | ConditionResult 컴포넌트 | AI 분석 결과 표시 |
| 2-11 | ConditionEditor 컴포넌트 | 슬라이더/선택지로 결과 수정 + 추가 메모 입력 |
| 2-12 | ConditionBadge 컴포넌트 | 에너지/무드/스트레스/수면 시각화 |
| 2-13 | 컨디션 체크 화면 (회원) | 카메라 → 분석 → 수정 → 등록 전체 플로우 |

### 완료 기준
- 강사: 주간 스케줄 등록 → 요일별 확인
- 회원: 카메라 촬영 → AI 컨디션 분석 결과 표시
- 회원: 분석 결과 수정 → 추가 메모 작성 → 등록
- AI 원본 + 회원 수정본 모두 DB 저장 확인

### 의존성
- Phase 1 완료
- Anthropic API 키 (Claude Vision)

---

## Phase 3: LLM 운동 시퀀스 생성 ✅ 완료

### 목표
컨디션 + 프로필 기반 맞춤 시퀀스 자동 생성

### 작업 항목

| # | 작업 | 상세 | 상태 |
|---|---|---|---|
| 3-1 | sessions, exerciseSequences 스키마 | Drizzle 스키마 + 마이그레이션 | ✅ |
| 3-2 | exerciseCatalog 스키마 + 시드 데이터 | 기본 운동 50개+ | ✅ |
| 3-3 | Claude Text API 서비스 | sequence-generator.ts에 통합 | ✅ |
| 3-4 | 시퀀스 생성 서비스 | sequence-generator.ts (확장 컨디션 항목 반영 프롬프트) | ✅ |
| 3-5 | CategorySelector 컴포넌트 | 추가 운동 카테고리 선택 (최대 2개) | ✅ |
| 3-6 | 세션 CRUD API | POST/GET/PUT /sessions | ✅ |
| 3-7 | 시퀀스 생성 API | POST /sequences/generate | ✅ |
| 3-8 | 컨디션 등록 → 시퀀스 생성 연결 | 등록 완료 → 카테고리 선택 → 시퀀스 생성 → 오늘 탭 | ✅ |
| 3-9 | 오늘의 시퀀스 화면 (회원) | 운동 목록 표시 | ✅ |

### Sprint 3 이후 추가 구현사항
| # | 작업 | 상세 |
|---|---|---|
| 3-10 | Claude Vision API 실제 연동 | @anthropic-ai/sdk, claude-sonnet-4-20250514, tool_use 패턴, mock fallback |
| 3-11 | 웹캠 촬영 기능 | WebCamera.tsx (브라우저 getUserMedia API), 촬영 이미지 미리보기 |
| 3-12 | 컨디션 체크 플로우 개선 | 단계별 로딩("컨디션 분석 중"→"등록 중"→"시퀀스 생성 중"), 완료 후 오늘 탭 자동 이동 |
| 3-13 | memberId 자동 조회 | POST /condition/register에서 로그인 사용자의 members 레코드 자동 조회 |
| 3-14 | 시퀀스 재생성 시 기존 삭제 | POST /sequences/generate에서 같은 세션 기존 시퀀스 삭제 후 재생성 |
| 3-15 | 50분 수업 기준 시퀀스 | 워밍업 3개(~7분) + 메인 8~12개(~36분) + 쿨다운 3개(~7분), 휴식 15초 |
| 3-16 | 오늘 탭 빈 상태 UX | "오늘의 컨디션을 체크해 주세요" + 컨디션 체크 버튼, success:true data:null 처리 |
| 3-17 | 로그아웃 | 회원 프로필 탭 하단 + 강사 설정 탭 하단 |

### 완료 기준
- E2E: 촬영 → 컨디션 분석 → 수정 → 카테고리 선택 → 시퀀스 생성 → 확인
- 수면 부족 감지 시 고강도 운동 제외 확인
- 안면 근긴장 감지 시 해당 부위 이완 운동 추가 확인
- 회원 메모(예: "어깨 뻐근") 반영 확인
- 금기 운동 미포함 확인

### 의존성
- Phase 2 완료

---

## Phase 4: 강사 리뷰 + 대시보드

### 작업 항목

| # | 작업 | 상세 |
|---|---|---|
| 4-1 | 대시보드 화면 (강사) | 오늘 세션 현황 (스케줄 기반), 컨디션/시퀀스 상태, 회원 메모 표시 |
| 4-2 | SessionStatusCard 컴포넌트 | 세션별 상태 카드 |
| 4-3 | SequenceEditor 컴포넌트 | 드래그 앤 드롭 편집 |
| 4-4 | 운동 상세 모달, 추가/삭제/수정 | 카탈로그 검색 + 인라인 편집 |
| 4-5 | 시퀀스 수정 API 연동 | PUT /sequences/:id |
| 4-6 | 저장 완료 피드백 | 토스트 + 대시보드 복귀 |

### 완료 기준
- 대시보드에서 스케줄 기반 오늘 세션 현황 확인
- 회원 메모 + 컨디션 요약 강사 뷰에서 확인
- 시퀀스 수정 → 저장 → 회원 앱 반영

### 의존성
- Phase 3 완료

---

## Phase 5: 회원 뷰 + 알림 + 자동 생성

### 작업 항목

| # | 작업 | 상세 |
|---|---|---|
| 5-1 | 운동 상세 화면 (회원) | 운동 설명, 수정사항 |
| 5-2 | 히스토리 화면 (회원/강사) | 날짜별 과거 세션 |
| 5-3 | 세션 완료 처리 | 강사가 completed 변경 |
| 5-4 | expo-notifications 설정 | push 토큰 등록, 알림 수신 |
| 5-5 | push-notification 서비스 | expo-server-sdk 연동 |
| 5-6 | 12시 컨디션 리마인더 크론잡 | condition-reminder.ts |
| 5-7 | 1시 자동 시퀀스 생성 크론잡 | auto-sequence.ts |
| 5-8 | 컨디션 체크 마감 처리 | 1시 이후 요청 시 마감 응답 |
| 5-9 | 자동 생성 뱃지 UI | isAutoGenerated 표시 |
| 5-10 | 시퀀스 생성/수정 알림 | 회원에게 push 발송 |

### 완료 기준
- 12시 미체크 회원에게 push 알림 수신 확인
- 1시 크론잡 → 자동 시퀀스 생성 → 회원/강사 알림
- 1시 이후 컨디션 체크 시 마감 안내
- 강사 시퀀스 수정 → 회원 알림

### 의존성
- Phase 4 완료

---

## Phase 6: 폴리싱 + 프로덕션

### 작업 항목

| # | 작업 | 상세 |
|---|---|---|
| 6-1 | 에러 처리 통일 | 전역 에러 바운더리, 토스트 |
| 6-2 | 로딩 상태 | 스켈레톤 UI, 프로그레스 |
| 6-3 | 오프라인 폴백 | TanStack Query 캐시 |
| 6-4 | 레이트 리밋 | 컨디션 체크 API 제한 |
| 6-5 | 앱 아이콘 + 스플래시 | 디자인 + Expo 설정 |
| 6-6 | 온보딩 플로우 | 안내 화면 (3-4 슬라이드) |
| 6-7 | 성능 최적화 | 이미지 압축, 리스트 가상화 |
| 6-8 | EAS Build 설정 | iOS/Android 빌드 프로파일 |
| 6-9 | 테스트 배포 | TestFlight / Internal Testing |

---

## 외부 서비스 설정 체크리스트

| 서비스 | 필요 시점 | 설정 항목 |
|---|---|---|
| **Docker PostgreSQL** | Phase 0 | 기존 Docker 컨테이너 확인, pilates DB 생성 |
| **Anthropic** | Phase 2 | API 키 발급, 사용량 모니터링 |
| **Expo Push** | Phase 5 | Push 알림 설정, 서버 SDK |
| **Railway** | Phase 6 | 백엔드 배포, 환경변수 |
| **Expo EAS** | Phase 6 | 빌드 프로파일, 서명 키 |

---

## 환경변수 목록

### 프론트엔드 (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 백엔드 (.env)
```
# Server
PORT=3000
NODE_ENV=development

# Database (Docker PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/pilates

# Anthropic (Claude Vision + Text)
ANTHROPIC_API_KEY=sk-ant-...

# JWT (자체 인증)
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cron Jobs
CONDITION_REMINDER_CRON=0 12 * * *
AUTO_SEQUENCE_CRON=0 13 * * *
CRON_TIMEZONE=Asia/Seoul

# Expo Push
EXPO_ACCESS_TOKEN=...
```
