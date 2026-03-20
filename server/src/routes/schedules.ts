import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { weeklySchedules, members, sessions } from "../db/schema";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthUser } from "../middleware/auth";
import {
  createScheduleSchema,
  updateScheduleSchema,
} from "../shared/validation";

const schedulesRouter = new Hono();

// 모든 라우트에 인증 + 강사 권한 필요
schedulesRouter.use("*", authMiddleware);

// GET /api/schedules - 스케줄 목록 (강사 전용)
schedulesRouter.get("/", requireRole("instructor"), async (c) => {
  const authUser = c.get("user") as AuthUser;
  const dayOfWeekParam = c.req.query("dayOfWeek");

  const conditions = [
    eq(weeklySchedules.instructorId, authUser.userId),
  ];

  if (dayOfWeekParam !== undefined && dayOfWeekParam !== "") {
    const dayOfWeek = Number(dayOfWeekParam);
    if (!isNaN(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6) {
      conditions.push(eq(weeklySchedules.dayOfWeek, dayOfWeek));
    }
  }

  const rows = await db
    .select({
      schedule: weeklySchedules,
      memberName: members.name,
    })
    .from(weeklySchedules)
    .leftJoin(members, eq(weeklySchedules.memberId, members.id))
    .where(and(...conditions))
    .orderBy(weeklySchedules.dayOfWeek, weeklySchedules.startTime);

  return c.json({
    success: true,
    data: rows.map((r) => ({
      ...r.schedule,
      memberName: r.memberName,
      createdAt: r.schedule.createdAt.toISOString(),
      updatedAt: r.schedule.updatedAt.toISOString(),
    })),
  });
});

// GET /api/schedules/today - 오늘 수업 대상 회원 목록 (강사 전용)
schedulesRouter.get("/today", requireRole("instructor"), async (c) => {
  const authUser = c.get("user") as AuthUser;
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=일~6=토
  const todayStr = today.toISOString().split("T")[0]!; // "YYYY-MM-DD"

  // 오늘 요일의 활성 스케줄 조회
  const todaySchedules = await db
    .select({
      schedule: weeklySchedules,
      memberName: members.name,
      memberFitnessLevel: members.fitnessLevel,
      memberBodyConditions: members.bodyConditions,
    })
    .from(weeklySchedules)
    .leftJoin(members, eq(weeklySchedules.memberId, members.id))
    .where(
      and(
        eq(weeklySchedules.instructorId, authUser.userId),
        eq(weeklySchedules.dayOfWeek, dayOfWeek),
        eq(weeklySchedules.isActive, true)
      )
    )
    .orderBy(weeklySchedules.startTime);

  // 각 스케줄에 대해 오늘 날짜의 세션 존재 여부 확인
  const result = await Promise.all(
    todaySchedules.map(async (row) => {
      const [session] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.memberId, row.schedule.memberId),
            eq(sessions.date, todayStr)
          )
        )
        .limit(1);

      return {
        ...row.schedule,
        memberName: row.memberName,
        memberFitnessLevel: row.memberFitnessLevel,
        memberBodyConditions: row.memberBodyConditions,
        createdAt: row.schedule.createdAt.toISOString(),
        updatedAt: row.schedule.updatedAt.toISOString(),
        session: session
          ? {
              id: session.id,
              status: session.status,
              conditionCheckedAt: session.conditionCheckedAt,
              conditionFinal: session.conditionFinal,
            }
          : null,
      };
    })
  );

  return c.json({
    success: true,
    data: result,
    meta: {
      date: todayStr,
      dayOfWeek,
    },
  });
});

// POST /api/schedules - 스케줄 등록 (강사 전용)
schedulesRouter.post("/", requireRole("instructor"), async (c) => {
  const authUser = c.get("user") as AuthUser;
  const body = await c.req.json();
  const result = createScheduleSchema.safeParse(body);

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

  // 회원 존재 확인
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, data.memberId))
    .limit(1);

  if (!member) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "회원을 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  const [newSchedule] = await db
    .insert(weeklySchedules)
    .values({
      memberId: data.memberId,
      instructorId: authUser.userId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
    })
    .returning();

  if (!newSchedule) {
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "스케줄 생성에 실패했습니다",
          statusCode: 500,
        },
      },
      500
    );
  }

  return c.json(
    {
      success: true,
      data: {
        ...newSchedule,
        createdAt: newSchedule.createdAt.toISOString(),
        updatedAt: newSchedule.updatedAt.toISOString(),
      },
    },
    201
  );
});

// PUT /api/schedules/:id - 스케줄 수정 (강사 전용)
schedulesRouter.put("/:id", requireRole("instructor"), async (c) => {
  const authUser = c.get("user") as AuthUser;
  const scheduleId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(weeklySchedules)
    .where(
      and(
        eq(weeklySchedules.id, scheduleId),
        eq(weeklySchedules.instructorId, authUser.userId)
      )
    )
    .limit(1);

  if (!existing) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "스케줄을 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  const body = await c.req.json();
  const result = updateScheduleSchema.safeParse(body);

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

  const updateData = {
    ...result.data,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(weeklySchedules)
    .set(updateData)
    .where(eq(weeklySchedules.id, scheduleId))
    .returning();

  if (!updated) {
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "스케줄 수정에 실패했습니다",
          statusCode: 500,
        },
      },
      500
    );
  }

  return c.json({
    success: true,
    data: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

// DELETE /api/schedules/:id - 스케줄 삭제 (강사 전용)
schedulesRouter.delete("/:id", requireRole("instructor"), async (c) => {
  const authUser = c.get("user") as AuthUser;
  const scheduleId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(weeklySchedules)
    .where(
      and(
        eq(weeklySchedules.id, scheduleId),
        eq(weeklySchedules.instructorId, authUser.userId)
      )
    )
    .limit(1);

  if (!existing) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "스케줄을 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  await db
    .delete(weeklySchedules)
    .where(eq(weeklySchedules.id, scheduleId));

  return c.json({
    success: true,
    message: "스케줄이 삭제되었습니다",
  });
});

export default schedulesRouter;
