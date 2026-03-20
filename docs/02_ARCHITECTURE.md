# 기술 아키텍처 문서

## 1. 시스템 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                    React Native (Expo)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 강사 화면  │  │ 회원 화면  │  │ 인증 화면  │              │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘              │
│        │             │             │                     │
│  ┌─────┴─────────────┴─────────────┴────┐               │
│  │  Zustand (로컬) + TanStack Query (서버) │               │
│  └─────────────────┬────────────────────┘               │
│                    │                                     │
│  ┌─────────────────┴────────────────────┐               │
│  │  카메라 (컨디션 체크용 촬영)              │               │
│  │  - 웹: WebCamera (getUserMedia API)   │               │
│  │  - 네이티브: expo-camera              │               │
│  │  expo-notifications (push 알림)        │               │
│  └─────────────────┬────────────────────┘               │
└────────────────────┼────────────────────────────────────┘
                     │ HTTPS
┌────────────────────┼────────────────────────────────────┐
│                    ▼           Backend (Hono + Node.js)  │
│  ┌─────────────────────────────────────┐                │
│  │            API Routes                │                │
│  │  /auth  /members  /condition        │                │
│  │  /sessions  /sequences  /exercises  │                │
│  │  /schedules  /notifications         │                │
│  └──────┬──────────┬──────────┬────────┘                │
│         │          │          │                          │
│         │     ┌────┴──────────┴─────────┐              │
│         │     │     Claude API           │              │
│         │     │ Vision (컨디션 분석)       │              │
│         │     │ Text  (시퀀스 생성)       │              │
│         │     └──────────────────────────┘              │
│  ┌──────┴──────────────────────────────┐                │
│  │  PostgreSQL (Docker, 로컬 실행 중)    │                │
│  └─────────────────────────────────────┘                │
│                                                         │
│  ┌─────────────────────────────────────┐                │
│  │  Cron Jobs                           │                │
│  │  - 12:00 컨디션 체크 push 알림        │                │
│  │  - 13:00 자동 시퀀스 생성             │                │
│  └─────────────────────────────────────┘                │
│                                                         │
│  ┌─────────────────────────────────────┐                │
│  │  Push Notification Service           │                │
│  │  (Expo Push Notifications)           │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 기술 스택 상세

### 2.1 프론트엔드 (모바일)

| 기술 | 버전 | 용도 | 선택 이유 |
|---|---|---|---|
| **React Native** | 0.76+ | 크로스 플랫폼 모바일 앱 | iOS/Android 동시 개발, 큰 생태계 |
| **Expo** | SDK 52+ | 개발 환경, 빌드, 배포 | 관리형 워크플로우로 빠른 개발, OTA 업데이트 |
| **expo-router** | v4 | 파일 기반 라우팅 | 직관적 라우트 구조, 딥링크 자동 지원 |
| **expo-camera** | - | 카메라 접근 (네이티브) | 컨디션 체크용 얼굴 촬영 (네이티브 환경) |
| **WebCamera** | - | 웹캠 접근 (웹) | 브라우저 getUserMedia API로 웹캠 캡처 (Platform.OS === "web") |
| **expo-notifications** | - | Push 알림 | 컨디션 체크 리마인더, 시퀀스 생성 알림 |
| **NativeWind** | v4 | Tailwind CSS for RN | 빠른 스타일링, 웹 개발자 친화적 |
| **Zustand** | v5 | 로컬 상태관리 | 보일러플레이트 최소, 간결한 API |
| **TanStack Query** | v5 | 서버 상태 캐싱 | 자동 캐싱/리페칭, 옵티미스틱 업데이트 |
| **React Hook Form** | v7 | 폼 관리 | 성능 최적화, Zod 스키마 검증 연동 |
| **Zod** | v3 | 스키마 검증 | 런타임 타입 검증, 프론트-백 공유 가능 |
| **expo-secure-store** | - | 보안 저장소 | JWT 토큰 안전 저장 |

### 2.2 백엔드

| 기술 | 버전 | 용도 | 선택 이유 |
|---|---|---|---|
| **Node.js** | 20 LTS | 런타임 | TypeScript 네이티브 지원, 프론트와 언어 통일 |
| **Hono** | v4 | HTTP 프레임워크 | 초경량, TypeScript 퍼스트, Edge 배포 가능 |
| **Drizzle ORM** | v0.36+ | 데이터베이스 ORM | 타입 안전, SQL에 가까운 API, 경량 |
| **PostgreSQL** | 15+ | 메인 데이터베이스 | 관계형, JSONB 지원, Docker로 로컬 실행 중 |
| **bcrypt** | v5 | 비밀번호 해싱 | 안전한 비밀번호 저장 |
| **jsonwebtoken** | v9 | JWT 발급/검증 | 자체 인증 시스템 |
| **Zod** | v3 | 요청 검증 | 프론트엔드와 스키마 공유 |
| **node-cron** | v3 | 스케줄러 | 12시 알림 + 1시 자동 시퀀스 생성 |
| **expo-server-sdk** | - | Push 알림 서버 | Expo Push Notification 발송 |

### 2.3 AI 서비스

| 서비스 | 용도 | 선택 이유 |
|---|---|---|
| **Claude Vision API** | 얼굴 사진 기반 컨디션 분석 (감정, 에너지, 수면, 근긴장, 부종 등) | 풍부한 자연어 분석, 다면적 컨디션 평가 가능 |
| **Claude Text API (Sonnet)** | 운동 시퀀스 생성 | 구조화된 JSON 출력, 복합 조건 추론 |
| **@anthropic-ai/sdk** | Anthropic 공식 Node.js SDK | Claude Vision/Text API 호출에 사용 |

> **참고**: 얼굴 인식/본인 확인은 수행하지 않음. 로그인 기반으로 사용자 식별.

**Claude Vision 연동 상세:**
- 모델: `claude-sonnet-4-20250514`
- 응답 패턴: `tool_use`로 구조화된 JSON 응답 강제
- 서비스 파일: `server/src/services/claude-vision.ts`
- API 키 없거나 API 호출 실패 시 mock fallback으로 동작
- `.env`에 `ANTHROPIC_API_KEY` 필요

### 2.4 인프라

| 서비스 | 용도 |
|---|---|
| **Docker** | PostgreSQL 로컬 실행 (개발) |
| **Railway** | 백엔드 서버 호스팅 (프로덕션) |
| **Expo EAS** | 앱 빌드 및 배포 |
| **Expo Push Service** | Push 알림 전송 |

---

## 3. 프로젝트 디렉토리 구조

```
pilates/
├── docs/                              # 프로젝트 문서
│
├── front/                             # 프론트엔드 (Expo 앱)
│   ├── app/                           # Expo Router - 파일 기반 라우트
│   │   ├── _layout.tsx                # 루트 레이아웃 (인증 상태 체크)
│   │   ├── index.tsx                  # 엔트리 리다이렉트
│   │   ├── (auth)/                    # 인증 그룹
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx              # 로그인 화면
│   │   │   └── register.tsx           # 회원가입 화면
│   │   ├── (instructor)/              # 강사 탭 그룹
│   │   │   ├── _layout.tsx            # 탭 네비게이터
│   │   │   ├── dashboard.tsx          # 대시보드 (오늘 세션 현황)
│   │   │   ├── members/
│   │   │   │   ├── index.tsx          # 회원 목록
│   │   │   │   └── [id].tsx           # 회원 상세/편집
│   │   │   ├── schedule.tsx           # 주간 수업 스케줄 관리
│   │   │   ├── sessions.tsx           # 세션 히스토리
│   │   │   └── settings.tsx           # 설정
│   │   │
│   │   │   ※ 모달/스택 화면:
│   │   │   ├── review.tsx             # 시퀀스 리뷰/편집
│   │   │   └── member-form.tsx        # 회원 등록/편집 폼
│   │   │
│   │   └── (member)/                  # 회원 탭 그룹
│   │       ├── _layout.tsx            # 탭 네비게이터
│   │       ├── today.tsx              # 오늘의 시퀀스
│   │       ├── condition-check.tsx    # 컨디션 체크 (카메라 + 결과 수정 + 카테고리 선택)
│   │       ├── history.tsx            # 운동 기록
│   │       └── profile.tsx            # 프로필 편집
│   │
│   │       ※ 모달/스택 화면:
│   │       └── exercise-detail.tsx    # 운동 상세
│   │
│   ├── components/                    # 재사용 컴포넌트
│   │   ├── camera/
│   │   │   ├── WebCamera.tsx          # 웹캠 캡처 (웹 전용, getUserMedia API)
│   │   │   └── FaceCapture.tsx        # 얼굴 캡처 카메라 (네이티브)
│   │   ├── condition/
│   │   │   ├── ConditionResult.tsx    # 컨디션 분석 결과 표시
│   │   │   ├── ConditionEditor.tsx    # 컨디션 결과 수정 UI (슬라이더, 선택지)
│   │   │   └── ConditionBadge.tsx     # 컨디션 뱃지 (에너지/무드/스트레스)
│   │   ├── exercise/
│   │   │   ├── SequenceCard.tsx       # 시퀀스 카드
│   │   │   ├── ExerciseItem.tsx       # 개별 운동 아이템
│   │   │   ├── SequenceEditor.tsx     # 드래그 앤 드롭 편집기 (강사용)
│   │   │   └── CategorySelector.tsx   # 추가 운동 카테고리 선택 (회원용)
│   │   ├── schedule/
│   │   │   ├── WeeklySchedule.tsx     # 주간 스케줄 뷰
│   │   │   └── ScheduleEditor.tsx     # 스케줄 편집 UI
│   │   ├── member/
│   │   │   ├── MemberCard.tsx         # 회원 카드 (목록용)
│   │   │   └── BodyConditionTag.tsx   # 신체 상태 태그
│   │   ├── dashboard/
│   │   │   ├── SessionStatusCard.tsx  # 세션 현황 카드 (강사 대시보드)
│   │   │   └── ConditionSummary.tsx   # 컨디션 체크 현황 요약
│   │   └── ui/                        # 디자인 시스템
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       ├── Slider.tsx             # 컨디션 수정용 슬라이더
│   │       └── LoadingSpinner.tsx
│   │
│   ├── lib/                           # 유틸리티 및 비즈니스 로직
│   │   ├── api/
│   │   │   ├── client.ts              # HTTP 클라이언트
│   │   │   ├── auth.ts                # 인증 API
│   │   │   ├── members.ts             # 회원 API
│   │   │   ├── condition.ts           # 컨디션 체크 API
│   │   │   ├── sessions.ts            # 세션 API
│   │   │   ├── sequences.ts           # 시퀀스 API
│   │   │   └── schedules.ts           # 스케줄 API
│   │   ├── stores/
│   │   │   ├── authStore.ts           # 인증 상태 (Zustand)
│   │   │   └── conditionStore.ts      # 컨디션 체크 상태
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # 인증 훅
│   │   │   ├── useCamera.ts           # 카메라 훅
│   │   │   ├── useMember.ts           # 회원 데이터 훅
│   │   │   ├── useSequence.ts         # 시퀀스 데이터 훅
│   │   │   └── useNotifications.ts    # Push 알림 훅
│   │   ├── types/
│   │   │   └── index.ts               # 공유 TypeScript 타입
│   │   ├── constants/
│   │   │   ├── bodyConditions.ts      # 신체 상태 상수
│   │   │   ├── exercises.ts           # 운동 카테고리/기구 상수
│   │   │   └── categories.ts          # 추가 운동 카테고리 상수
│   │   └── utils/
│   │       ├── conditionMapper.ts     # Claude Vision 응답 → 앱 컨디션 모델 변환
│   │       ├── notifications.ts       # Push 알림 등록/관리 유틸
│   │       └── validation.ts          # Zod 스키마
│   │
│   ├── shared/                        # 프론트/백 공유
│   │   └── types.ts                   # 공유 타입 정의
│   │
│   ├── app.json                       # Expo 설정
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .gitignore
│
├── server/                            # 백엔드 서버
│   ├── src/
│   │   ├── index.ts                   # 서버 엔트리포인트
│   │   ├── routes/
│   │   │   ├── auth.ts                # 인증 API
│   │   │   ├── members.ts             # 회원 CRUD
│   │   │   ├── condition.ts           # 컨디션 분석 API
│   │   │   ├── sessions.ts            # 세션 CRUD
│   │   │   ├── sequences.ts           # 시퀀스 생성/수정
│   │   │   ├── schedules.ts           # 주간 스케줄 관리
│   │   │   └── exercises.ts           # 운동 카탈로그
│   │   ├── services/
│   │   │   ├── claude-vision.ts       # Claude Vision API (@anthropic-ai/sdk, tool_use 패턴, mock fallback)
│   │   │   ├── sequence-generator.ts  # 프롬프트 구성 + Claude Text API 시퀀스 생성 (50분 수업 기준)
│   │   │   └── push-notification.ts   # Push 알림 발송 서비스
│   │   ├── jobs/
│   │   │   ├── condition-reminder.ts  # 12시 컨디션 체크 리마인더
│   │   │   └── auto-sequence.ts       # 1시 자동 시퀀스 생성
│   │   ├── db/
│   │   │   ├── schema.ts              # Drizzle 스키마
│   │   │   ├── index.ts               # DB 연결
│   │   │   └── migrations/            # 마이그레이션
│   │   └── middleware/
│   │       ├── auth.ts                # JWT 검증
│   │       └── roleGuard.ts           # 역할 기반 접근 제어
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
│
└── .gitignore
```

---

## 4. 핵심 데이터 흐름

### 4.1 회원 컨디션 체크 → 시퀀스 자동 생성 파이프라인

```
[회원 앱: 카메라 촬영]
     │ base64 이미지 (로그인 상태, 별도 본인 확인 없음)
     ▼
[POST /condition/analyze]
     │
     └─→ [Claude Vision API 호출]
              │ 입력: 촬영 사진 1장 + 분석 요청 프롬프트
              │
              └─→ 컨디션 분석 결과
                   - 에너지, 무드, 스트레스
                   - 수면 상태, 안면 근긴장, 부종
                   - 피부 상태, 컨디션 요약
                   - 각 항목 confidence score
                       │
                       ▼
              응답: { condition (AI 원본) }
                       │
                       ▼
[회원 앱: 분석 결과 표시]
     │
     ▼
[회원: 결과 확인 및 수정 (선택)]
     │ 슬라이더/선택지로 에너지/무드/스트레스/수면 조절
     │ 추가 메모 작성 (예: "오른쪽 어깨가 뻐근해요")
     ▼
[POST /condition/register]
     │ AI 원본 + 회원 수정본 모두 저장
     ▼
[회원: 추가 운동 카테고리 선택 (선택사항)]
     │ requestedCategories: ["core", "flexibility"]
     ▼
[POST /sequences/generate]
     │
     ├─→ DB에서 회원 프로필 조회 (bodyConditions, preferences)
     ├─→ DB에서 최근 5회 세션 조회 (반복 방지)
     ├─→ 확정된 컨디션 (회원 수정 반영) + 추가 카테고리 포함
     │
     └─→ [Claude Text API 호출]
              │ 프롬프트: 프로필 + 컨디션 + 추가 카테고리 + 히스토리
              ▼
         구조화된 JSON 시퀀스
              │
              ▼
     DB 저장 + 회원에게 즉시 배정 + push 알림
```

### 4.2 알림 + 자동 생성 플로우

```
[서버 크론잡: 매일 12:00]
     │
     ▼
[오늘 수업 스케줄이 있지만 컨디션 미체크 회원 조회]
     │
     ▼
[각 회원에게 push 알림 발송]
     "오늘 수업이 있습니다! 컨디션 체크를 진행해주세요."

     --- 1시간 경과 ---

[서버 크론잡: 매일 13:00]
     │
     ▼
[여전히 컨디션 미체크 & 시퀀스 미생성 회원 조회]
     │
     ▼
[각 회원에 대해]
     ├─→ DB에서 프로필 + 최근 세션 조회
     └─→ [Claude Text API] (컨디션 없이 프로필만으로 시퀀스 생성)
              │
              ▼
         DB 저장 + 자동 배정 (isAutoGenerated: true)
              │
              ▼
         회원에게 push 알림 + 강사 대시보드 알림
```

### 4.3 인증 흐름

```
[로그인/회원가입]
     ▼
[POST /auth/login 또는 /auth/register]
     │ 서버에서 bcrypt 비밀번호 검증/해싱
     │ jsonwebtoken으로 JWT 발급 (access + refresh)
     ▼
[expo-secure-store에 토큰 저장]
     ▼
[API 요청마다 Authorization: Bearer {token}]
     ▼
[서버 미들웨어: JWT 검증 + 역할 확인]
```

---

## 5. Claude Vision 연동 상세 (컨디션 분석)

### 5.1 컨디션 분석 프롬프트

> 본인 확인은 수행하지 않음. 컨디션 분석만 수행.

```
당신은 얼굴 분석을 통한 컨디션 평가 전문가입니다.
아래 사진의 인물의 현재 컨디션을 분석해주세요.

## 분석 항목

### 기본 컨디션
- 에너지 레벨 (1-10): 표정의 활력, 눈의 생기 등
- 주요 무드: HAPPY, CALM, SAD, STRESSED, TIRED 중 하나
- 스트레스 지표 (1-10): 긴장, 불안, 피로 관련 표정

### 수면 상태
- 수면 품질: GOOD, FAIR, POOR 중 하나
- 관찰 근거: 다크서클, 눈 부기, 눈 개방도 등

### 안면 근긴장 패턴
- 이마/미간 긴장 (1-5): 이마 주름, 미간 찡그림
- 턱 긴장 (1-5): 교근 긴장, 이 악물기 흔적
- 좌우 비대칭: LEFT, RIGHT, NONE

### 안면 부종
- 부종 정도: NONE, MILD, MODERATE

### 피부 상태 (보조 지표)
- 창백함 여부: boolean
- 홍조 여부: boolean

### 종합
- 컨디션 요약: 한 문장으로 현재 상태 설명
- 운동 시 주의사항: 한 문장 (해당 시에만)

각 항목에 confidence (0.0~1.0)를 포함해주세요.
반드시 아래 JSON 형식으로 응답하세요:

{
  "energy": { "level": 6, "confidence": 0.85 },
  "mood": { "value": "CALM", "confidence": 0.90 },
  "stress": { "level": 3, "confidence": 0.80 },
  "sleep": { "quality": "FAIR", "confidence": 0.75 },
  "facialTension": {
    "forehead": { "level": 2, "confidence": 0.70 },
    "jaw": { "level": 3, "confidence": 0.65 },
    "asymmetry": { "value": "NONE", "confidence": 0.60 }
  },
  "swelling": { "level": "NONE", "confidence": 0.70 },
  "skin": {
    "pallor": { "value": false, "confidence": 0.50 },
    "flushed": { "value": false, "confidence": 0.50 }
  },
  "summary": "차분하고 안정된 상태이나 수면이 다소 부족해 보임",
  "exerciseNote": "급격한 고강도 운동보다는 점진적 강도 증가 권장"
}
```

---

## 6. Claude Text API - 시퀀스 생성 연동 상세

### 6.1 프롬프트 구조

**System Prompt:**
```
당신은 경력 15년의 공인 필라테스 강사 AI입니다.
회원의 프로필과 현재 컨디션을 분석하여 개인 맞춤 필라테스 운동 시퀀스를 생성합니다.

규칙:
1. 회원의 신체 상태(금기사항)에 해당하는 운동은 절대 포함하지 마세요.
2. 에너지 레벨이 낮으면 부드럽고 회복적인 운동을 우선하세요.
3. 스트레스가 높으면 호흡과 마인드풀니스 운동을 포함하세요.
4. 수면 부족(POOR)일 때 고강도 운동을 제외하고, 점진적 강도 증가로 구성하세요.
5. 안면 근긴장이 감지되면 해당 부위(목/어깨/턱) 이완 운동을 추가하세요.
6. 안면 부종이 있으면 림프 순환 촉진 워밍업을 포함하세요.
7. 최근 세션과 중복되지 않도록 다양성을 유지하세요.
8. 워밍업 → 메인 운동 → 쿨다운 순서를 반드시 지키세요.
9. 회원이 추가로 요청한 운동 카테고리가 있다면 우선적으로 반영하세요.
10. 컨디션 정보가 없는 경우, 프로필과 운동 이력만으로 균형 잡힌 시퀀스를 구성하세요.
11. 회원이 남긴 추가 메모(통증 부위 등)를 반드시 고려하세요.

출력은 반드시 지정된 JSON 스키마를 따르세요.
```

**User Message 템플릿:**
```
## 회원 프로필
- 이름: {name}
- 피트니스 레벨: {fitnessLevel}
- 신체 상태: {bodyConditions 목록}
- 운동 선호: 선호 기구 {equipment}, 목표 {goals}
- 피해야 할 운동: {avoidExercises}

## 오늘 컨디션
{컨디션 있을 때}
- 에너지 레벨: {energy}/10
- 무드: {mood}
- 스트레스: {stress}/10
- 수면 상태: {sleepQuality}
- 안면 근긴장: 이마 {forehead}/5, 턱 {jaw}/5, 비대칭 {asymmetry}
- 부종: {swelling}
- 컨디션 요약: {summary}
- 회원 메모: {memberNote} (예: "오른쪽 어깨가 뻐근해요")
{컨디션 없을 때}
- 컨디션 체크 미완료 (프로필 기반으로 생성)

## 회원 추가 요청 카테고리
{있을 때} {requestedCategories}
{없을 때} 없음

## 최근 세션 (최근 5회)
{세션별 요약: 날짜, 주요 운동, 집중 부위}

## 조건
- 가용 기구: {availableEquipment}
- 목표 시간: {targetMinutes}분

위 정보를 종합하여 오늘의 필라테스 시퀀스를 생성해주세요.
```

### 6.2 응답 JSON 스키마
```json
{
  "sequence": [
    {
      "order": 1,
      "name": "운동명",
      "category": "warm-up|core|upper-body|lower-body|stretch|cool-down|full-body|breath",
      "equipment": "mat|reformer|chair|barrel|tower|ring|band|ball|roller|none",
      "durationSeconds": 60,
      "sets": 1,
      "reps": 10,
      "bodyFocus": ["core", "breath"],
      "difficulty": "beginner|intermediate|advanced",
      "modifications": "수정사항 설명 (해당 회원 맞춤)",
      "reasonForInclusion": "이 운동을 선택한 이유"
    }
  ],
  "totalDurationMinutes": 50,  // 50분 수업 기준: 워밍업 3개(~7분) + 메인 8~12개(~36분) + 쿨다운 3개(~7분), 세트 간 휴식 15초
  "focusSummary": "오늘 시퀀스의 전체 요약",
  "conditionNotes": "컨디션 반영 사항 설명"
}
```

---

## 7. 보안 아키텍처

### 7.1 인증/인가
- 자체 JWT 인증 (jsonwebtoken): access 15분, refresh 7일
- 비밀번호는 bcrypt로 해싱하여 DB 저장
- 서버 미들웨어에서 매 요청 JWT 검증
- `roleGuard` 미들웨어로 강사/회원 역할 분리

### 7.2 개인정보 보호
- 촬영된 얼굴 사진은 Claude Vision 분석 후 서버에 보관하지 않음 (분석 결과만 DB 저장)
- 모든 통신 HTTPS
- Push 토큰은 서버에 암호화 저장

### 7.3 API 키 관리
- Claude API 키는 서버 환경변수에만 저장
- JWT_SECRET은 서버 환경변수에만 저장
- 모바일 앱에는 API 키 미포함 (서버 API URL만 설정)
- `.env` 파일은 `.gitignore`에 포함
