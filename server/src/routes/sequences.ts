import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import {
  sessions,
  members,
  exerciseSequences,
  exerciseCatalog,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AuthUser } from "../middleware/auth";
import { generateSequenceSchema } from "../shared/validation";
import { generateSequence } from "../services/sequence-generator";

const sequencesRouter = new Hono();

// 모든 라우트에 인증 필요
sequencesRouter.use("*", authMiddleware);

// POST /api/sequences/generate - 시퀀스 생성
sequencesRouter.post("/generate", async (c) => {
  const body = await c.req.json();
  const result = generateSequenceSchema.safeParse(body);

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

  // 세션 찾기
  let session;
  if (data.sessionId) {
    const [found] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, data.sessionId))
      .limit(1);
    session = found;
  } else if (data.memberId && data.date) {
    const [found] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.memberId, data.memberId),
          eq(sessions.date, data.date)
        )
      )
      .limit(1);
    session = found;
  }

  if (!session) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "해당 세션을 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  // 회원 정보 가져오기
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, session.memberId))
    .limit(1);

  if (!member) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "회원 정보를 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  // 운동 카탈로그 가져오기
  const catalog = await db
    .select()
    .from(exerciseCatalog)
    .where(eq(exerciseCatalog.isActive, true));

  // 시퀀스 생성
  const memberProfile = {
    id: member.id,
    name: member.name,
    bodyConditions: (member.bodyConditions || []) as string[],
    exercisePreferences: (member.exercisePreferences || {}) as Record<
      string,
      unknown
    >,
    fitnessLevel: member.fitnessLevel,
  };

  const conditionFinal = session.conditionFinal as Record<string, unknown> | null;
  const requestedCategories = (session.requestedCategories || []) as string[];

  const catalogForGenerator = catalog.map((ex) => ({
    id: ex.id,
    name: ex.name,
    nameKo: ex.nameKo,
    category: ex.category,
    difficulty: ex.difficulty,
    equipment: ex.equipment,
    muscleGroups: (ex.muscleGroups || []) as string[],
    contraindications: (ex.contraindications || []) as string[],
    durationSeconds: ex.durationSeconds,
    description: ex.description,
    isActive: ex.isActive,
  }));

  const generated = generateSequence(
    memberProfile,
    conditionFinal as any,
    requestedCategories,
    catalogForGenerator
  );

  // DB에 저장
  const [sequence] = await db
    .insert(exerciseSequences)
    .values({
      sessionId: session.id,
      memberId: session.memberId,
      exercises: generated.exercises,
      totalDurationMinutes: generated.totalDurationMinutes,
      difficulty: generated.difficulty,
      focusAreas: generated.focusAreas,
      aiPromptUsed: `mock: energy=${(conditionFinal as any)?.energy?.level ?? "N/A"}, stress=${(conditionFinal as any)?.stress?.level ?? "N/A"}`,
    })
    .returning();

  // 세션 상태를 generated로 업데이트
  await db
    .update(sessions)
    .set({ status: "generated", updatedAt: new Date() })
    .where(eq(sessions.id, session.id));

  return c.json({
    success: true,
    data: {
      ...sequence,
      sequenceNote: generated.sequenceNote,
      createdAt: sequence.createdAt.toISOString(),
      updatedAt: sequence.updatedAt.toISOString(),
    },
  });
});

// GET /api/sequences/today - 현재 로그인 회원의 오늘 시퀀스
sequencesRouter.get("/today", async (c) => {
  const authUser = c.get("user") as AuthUser;

  // 회원 찾기 (userId로)
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.userId, authUser.userId))
    .limit(1);

  if (!member) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "회원 정보를 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\. /g, "-").replace(".", "");
  // Format: YYYY-MM-DD
  const todayFormatted = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  )
    .toISOString()
    .split("T")[0];

  // 오늘 세션 찾기
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.memberId, member.id),
        eq(sessions.date, todayFormatted!)
      )
    )
    .limit(1);

  if (!session) {
    return c.json({
      success: true,
      data: null,
      message: "오늘의 세션이 없습니다",
    });
  }

  // 시퀀스 찾기
  const [sequence] = await db
    .select()
    .from(exerciseSequences)
    .where(eq(exerciseSequences.sessionId, session.id))
    .limit(1);

  if (!sequence) {
    return c.json({
      success: true,
      data: null,
      message: "오늘의 시퀀스가 아직 생성되지 않았습니다",
    });
  }

  return c.json({
    success: true,
    data: {
      ...sequence,
      createdAt: sequence.createdAt.toISOString(),
      updatedAt: sequence.updatedAt.toISOString(),
    },
  });
});

// GET /api/sequences/:sessionId - 세션에 연결된 시퀀스 조회
sequencesRouter.get("/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  const [sequence] = await db
    .select()
    .from(exerciseSequences)
    .where(eq(exerciseSequences.sessionId, sessionId))
    .limit(1);

  if (!sequence) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "해당 세션의 시퀀스를 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      ...sequence,
      createdAt: sequence.createdAt.toISOString(),
      updatedAt: sequence.updatedAt.toISOString(),
    },
  });
});

export default sequencesRouter;
