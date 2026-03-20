import { Hono } from "hono";
import { eq, and, or, ilike, sql, count } from "drizzle-orm";
import { db } from "../db/index";
import { members } from "../db/schema";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthUser } from "../middleware/auth";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../shared/validation";

const membersRouter = new Hono();

// 모든 라우트에 인증 필요
membersRouter.use("*", authMiddleware);

// GET /api/members - 목록 (강사 전용)
membersRouter.get("/", requireRole("instructor"), async (c) => {
  const search = c.req.query("search") || "";
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 20));
  const offset = (page - 1) * limit;

  const conditions = [eq(members.isActive, true)];

  if (search) {
    conditions.push(
      or(
        ilike(members.name, `%${search}%`),
        ilike(sql`COALESCE(${members.phone}, '')`, `%${search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [totalResult] = await db
    .select({ total: count() })
    .from(members)
    .where(whereClause);

  const total = totalResult?.total ?? 0;

  const rows = await db
    .select()
    .from(members)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(members.createdAt);

  return c.json({
    success: true,
    data: rows.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/members - 회원 등록 (강사 전용)
membersRouter.post("/", requireRole("instructor"), async (c) => {
  const body = await c.req.json();
  const result = createMemberSchema.safeParse(body);

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

  // 회원용 user 계정은 없이 members 테이블에만 생성 (강사가 직접 등록하는 경우)
  const [newMember] = await db
    .insert(members)
    .values({
      userId: null, // 강사가 직접 등록 시 앱 계정 없음 (나중에 회원이 가입하면 연결)
      name: data.name,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      bodyConditions: data.bodyConditions,
      exercisePreferences: data.exercisePreferences,
      fitnessLevel: data.fitnessLevel,
      notes: data.notes,
    })
    .returning();

  if (!newMember) {
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "회원 생성에 실패했습니다",
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
        ...newMember,
        createdAt: newMember.createdAt.toISOString(),
        updatedAt: newMember.updatedAt.toISOString(),
      },
    },
    201
  );
});

// GET /api/members/:id - 상세 (강사 또는 본인)
membersRouter.get("/:id", async (c) => {
  const authUser = c.get("user") as AuthUser;
  const memberId = c.req.param("id");

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
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

  // 본인 또는 강사만 조회 가능
  if (authUser.role !== "instructor" && member.userId !== authUser.userId) {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "권한이 없습니다",
          statusCode: 403,
        },
      },
      403
    );
  }

  return c.json({
    success: true,
    data: {
      ...member,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    },
  });
});

// PUT /api/members/:id - 수정 (강사 또는 본인)
membersRouter.put("/:id", async (c) => {
  const authUser = c.get("user") as AuthUser;
  const memberId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!existing) {
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

  if (authUser.role !== "instructor" && existing.userId !== authUser.userId) {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "권한이 없습니다",
          statusCode: 403,
        },
      },
      403
    );
  }

  const body = await c.req.json();
  const result = updateMemberSchema.safeParse(body);

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
    .update(members)
    .set(updateData)
    .where(eq(members.id, memberId))
    .returning();

  if (!updated) {
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "회원 수정에 실패했습니다",
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

// DELETE /api/members/:id - 비활성화 (강사 전용)
membersRouter.delete("/:id", requireRole("instructor"), async (c) => {
  const memberId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!existing) {
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

  const [deactivated] = await db
    .update(members)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(members.id, memberId))
    .returning();

  return c.json({
    success: true,
    data: {
      ...deactivated,
      createdAt: deactivated!.createdAt.toISOString(),
      updatedAt: deactivated!.updatedAt.toISOString(),
    },
  });
});

export default membersRouter;
