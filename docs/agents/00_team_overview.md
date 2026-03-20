# Pilates AI - 팀 에이전트 운영 가이드

## 팀 구성

```
┌─────────────────────────────────────────┐
│              👨‍💼 팀장 (PM)               │
│  전체 조율, 작업 분배, 진행 관리, 품질 관리  │
└─────┬──────────┬──────────┬─────────────┘
      │          │          │
      ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🔧 백엔드 │ │ 🎨 프론트 │ │ 🧪 QA    │
│ API/DB/AI │ │ 앱 UI/UX  │ │ 테스트    │
└──────────┘ └──────────┘ └──────────┘
```

## 협업 흐름

```
1. 팀장이 Sprint 작업 분배
2. BE/FE가 병렬 개발 (shared/types.ts로 인터페이스 공유)
3. BE API 완성 → FE 연동
4. QA가 통합 테스트
5. 이슈 발견 → 팀장이 BE/FE에 수정 배정
6. 체크포인트 통과 → 다음 Sprint
```

## 공유 규칙

### 파일 소유권
| 영역 | 소유 에이전트 | 경로 |
|---|---|---|
| 서버 코드 | 백엔드 | `server/` |
| 앱 코드 | 프론트엔드 | `app/`, `components/`, `lib/` |
| 공유 타입 | BE/FE 협의 | `shared/` |
| 테스트 | QA | `tests/`, `__tests__/` |
| 문서 | 팀장 | `docs/` |
| 프로젝트 설정 | 팀장 | `CLAUDE.md`, `.env.example` |

### 커뮤니케이션 형식
에이전트 간 작업 요청/보고 시 아래 형식을 사용:

```
[FROM: 역할] [TO: 역할] [TYPE: 요청|완료|이슈|질문]
내용...
```

### API 계약 (Contract-First)
1. BE가 API 엔드포인트 구현 전, `shared/types.ts`에 타입 먼저 정의
2. FE는 해당 타입 기반으로 mock 데이터로 UI 개발
3. BE API 완성 후 FE가 mock → 실제 연동으로 교체
4. QA가 API + UI 통합 테스트

### Git 커밋 규칙
```
[역할] Sprint-N: 작업 내용

예:
[BE] Sprint-1: Add auth API (register, login, refresh)
[FE] Sprint-1: Add login/register screens
[QA] Sprint-1: Add auth integration tests
[PM] Sprint-1: Update development plan checkpoint
```
