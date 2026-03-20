import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { exerciseCatalog } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { exerciseFilterSchema } from "../shared/validation";

const exercisesRouter = new Hono();

// 모든 라우트에 인증 필요
exercisesRouter.use("*", authMiddleware);

// GET /api/exercises - 전체 카탈로그 (카테고리/장비/난이도 필터)
exercisesRouter.get("/", async (c) => {
  const query = c.req.query();
  const filterResult = exerciseFilterSchema.safeParse(query);

  if (!filterResult.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: filterResult.error.errors.map((e) => e.message).join(", "),
          statusCode: 400,
        },
      },
      400
    );
  }

  const { category, difficulty, equipment } = filterResult.data;

  // 동적 필터 조건 구성
  const conditions = [eq(exerciseCatalog.isActive, true)];

  if (category) {
    conditions.push(eq(exerciseCatalog.category, category));
  }
  if (difficulty) {
    conditions.push(eq(exerciseCatalog.difficulty, difficulty));
  }
  if (equipment) {
    conditions.push(eq(exerciseCatalog.equipment, equipment));
  }

  const exercises = await db
    .select()
    .from(exerciseCatalog)
    .where(and(...conditions));

  return c.json({
    success: true,
    data: exercises,
    total: exercises.length,
  });
});

export default exercisesRouter;
