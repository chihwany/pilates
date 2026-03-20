import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { sessions, members } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AuthUser } from "../middleware/auth";
import { conditionRegisterSchema } from "../shared/validation";
import { analyzeCondition } from "../services/claude-vision";

const conditionRouter = new Hono();

// 모든 라우트에 인증 필요
conditionRouter.use("*", authMiddleware);

// Mock 응답 (API 키 없거나 실패 시 fallback)
const MOCK_RESULT = {
  energy: { level: 6, confidence: 0.85 },
  mood: { value: "CALM" as const, confidence: 0.90 },
  stress: { level: 3, confidence: 0.80 },
  sleep: { quality: "FAIR" as const, confidence: 0.75 },
  facialTension: {
    forehead: { level: 2, confidence: 0.70 },
    jaw: { level: 3, confidence: 0.65 },
    asymmetry: { value: "NONE" as const, confidence: 0.60 },
  },
  swelling: { level: "NONE" as const, confidence: 0.70 },
  skin: {
    pallor: { value: false, confidence: 0.50 },
    flushed: { value: false, confidence: 0.50 },
  },
  summary: "차분하고 안정된 상태이나 수면이 다소 부족해 보임",
  exerciseNote: "급격한 고강도 운동보다는 점진적 강도 증가 권장",
};

// POST /api/condition/analyze - 이미지 수신 → Claude Vision 컨디션 분석
conditionRouter.post("/analyze", async (c) => {
  try {
    const body = await c.req.json();
    const { image, mediaType } = body as {
      image?: string;
      mediaType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    };

    // "mock" 문자열이면 mock 응답 반환 (하위 호환 / 테스트용)
    if (!image || image === "mock") {
      return c.json({
        success: true,
        data: MOCK_RESULT,
        mock: true,
      });
    }

    // data URI prefix 제거 (예: "data:image/jpeg;base64,..." → base64 부분만)
    let base64Data = image;
    let detectedMediaType = mediaType || "image/jpeg";
    if (image.startsWith("data:")) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match && match[1] && match[2]) {
        detectedMediaType = match[1] as typeof detectedMediaType;
        base64Data = match[2];
      }
    }

    const result = await analyzeCondition(base64Data, detectedMediaType);

    return c.json({
      success: true,
      data: result,
      mock: false,
    });
  } catch (error) {
    console.error("[condition/analyze] Claude Vision API error:", error);

    // API 실패 시 mock fallback
    return c.json({
      success: true,
      data: MOCK_RESULT,
      mock: true,
      warning: "AI 분석에 실패하여 기본값을 반환합니다. 직접 수정해주세요.",
    });
  }
});

// POST /api/condition/register - 컨디션 확정 등록
conditionRouter.post("/register", async (c) => {
  const authUser = c.get("user") as AuthUser;
  const body = await c.req.json();
  const result = conditionRegisterSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: result.error.errors.map((e) => e.message).join(", "),
          statusCode: 400,
        },
      },
      400
    );
  }

  const data = result.data;

  // memberId 결정: 요청 body에 memberId가 있으면 사용 (강사가 등록),
  // 없으면 로그인 사용자의 members 레코드에서 자동 조회
  let memberId = (body.memberId as string) || null;

  if (!memberId) {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, authUser.userId))
      .limit(1);

    if (member) {
      memberId = member.id;
    } else {
      return c.json(
        {
          error: {
            code: "MEMBER_NOT_FOUND",
            message: "회원 정보를 찾을 수 없습니다. 회원 역할로 가입된 계정인지 확인해주세요.",
            statusCode: 404,
          },
        },
        404
      );
    }
  }

  const now = new Date().toISOString();

  // 같은 날짜+회원의 기존 세션 확인
  const [existingSession] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.memberId, memberId),
        eq(sessions.date, data.date)
      )
    )
    .limit(1);

  let session;

  if (existingSession) {
    // 기존 세션 업데이트
    const [updated] = await db
      .update(sessions)
      .set({
        conditionAiRaw: data.conditionAiRaw || null,
        conditionFinal: data.conditionFinal || null,
        conditionCheckedAt: now,
        memberNote: data.memberNote || null,
        requestedCategories: data.requestedCategories,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, existingSession.id))
      .returning();
    session = updated;
  } else {
    // 새 세션 생성
    const [created] = await db
      .insert(sessions)
      .values({
        memberId,
        instructorId: authUser.role === "instructor" ? authUser.userId : null,
        date: data.date,
        conditionAiRaw: data.conditionAiRaw || null,
        conditionFinal: data.conditionFinal || null,
        conditionCheckedAt: now,
        memberNote: data.memberNote || null,
        requestedCategories: data.requestedCategories,
        status: "pending",
      })
      .returning();
    session = created;
  }

  if (!session) {
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "컨디션 등록에 실패했습니다",
          statusCode: 500,
        },
      },
      500
    );
  }

  return c.json({
    success: true,
    data: {
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    },
  });
});

export default conditionRouter;
