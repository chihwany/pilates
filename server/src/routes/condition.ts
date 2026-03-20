import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { sessions } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AuthUser } from "../middleware/auth";
import { conditionRegisterSchema } from "../shared/validation";

const conditionRouter = new Hono();

// 모든 라우트에 인증 필요
conditionRouter.use("*", authMiddleware);

// POST /api/condition/analyze - 이미지 수신 → mock 컨디션 결과 반환
conditionRouter.post("/analyze", async (c) => {
  // 이미지 수신 (실제로는 Claude Vision API를 사용하지만 현재 mock)
  // multipart/form-data 또는 base64 이미지를 받을 수 있음
  // 여기서는 요청을 받기만 하고 mock 응답 반환

  const mockResult = {
    energy: { level: 6, confidence: 0.85 },
    mood: { value: "CALM", confidence: 0.90 },
    stress: { level: 3, confidence: 0.80 },
    sleep: { quality: "FAIR", confidence: 0.75 },
    facialTension: {
      forehead: { level: 2, confidence: 0.70 },
      jaw: { level: 3, confidence: 0.65 },
      asymmetry: { value: "NONE", confidence: 0.60 },
    },
    swelling: { level: "NONE", confidence: 0.70 },
    skin: {
      pallor: { value: false, confidence: 0.50 },
      flushed: { value: false, confidence: 0.50 },
    },
    summary: "차분하고 안정된 상태이나 수면이 다소 부족해 보임",
    exerciseNote: "급격한 고강도 운동보다는 점진적 강도 증가 권장",
  };

  return c.json({
    success: true,
    data: mockResult,
  });
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
  // 없으면 sessions에서 해당 날짜+현재 사용자의 세션 찾기
  const memberId = (body.memberId as string) || null;

  if (!memberId) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "memberId가 필요합니다",
          statusCode: 400,
        },
      },
      400
    );
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
