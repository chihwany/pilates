import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users, members } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../lib/jwt";
import { authMiddleware } from "../middleware/auth";
import type { AuthUser } from "../middleware/auth";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  pushTokenSchema,
} from "../shared/validation";

const auth = new Hono();

// POST /api/auth/register
auth.post("/register", async (c) => {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);

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

  const { email, password, name, role } = result.data;

  // 이메일 중복 확인
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return c.json(
      {
        error: {
          code: "EMAIL_EXISTS",
          message: "이미 등록된 이메일입니다",
          statusCode: 409,
        },
      },
      409
    );
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({ email, passwordHash, name, role })
    .returning();

  if (!newUser) {
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "사용자 생성에 실패했습니다",
          statusCode: 500,
        },
      },
      500
    );
  }

  // member 역할일 경우 members 테이블에도 자동 생성
  if (role === "member") {
    await db.insert(members).values({
      userId: newUser.id,
      name,
    });
  }

  const payload = { userId: newUser.id, role: newUser.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return c.json(
    {
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString(),
        },
        accessToken,
        refreshToken,
      },
    },
    201
  );
});

// POST /api/auth/login
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const result = loginSchema.safeParse(body);

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

  const { email, password } = result.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return c.json(
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "이메일 또는 비밀번호가 올바르지 않습니다",
          statusCode: 401,
        },
      },
      401
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    return c.json(
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "이메일 또는 비밀번호가 올바르지 않습니다",
          statusCode: 401,
        },
      },
      401
    );
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      accessToken,
      refreshToken,
    },
  });
});

// POST /api/auth/refresh
auth.post("/refresh", async (c) => {
  const body = await c.req.json();
  const result = refreshTokenSchema.safeParse(body);

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

  try {
    const payload = verifyToken(result.data.refreshToken);
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role,
    });
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      role: payload.role,
    });

    return c.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch {
    return c.json(
      {
        error: {
          code: "INVALID_TOKEN",
          message: "유효하지 않거나 만료된 리프레시 토큰입니다",
          statusCode: 401,
        },
      },
      401
    );
  }
});

// GET /api/auth/me
auth.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user") as AuthUser;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.userId))
    .limit(1);

  if (!user) {
    return c.json(
      {
        error: {
          code: "USER_NOT_FOUND",
          message: "사용자를 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      pushToken: user.pushToken,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
});

// PUT /api/auth/push-token
auth.put("/push-token", authMiddleware, async (c) => {
  const authUser = c.get("user") as AuthUser;
  const body = await c.req.json();
  const result = pushTokenSchema.safeParse(body);

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

  const [updated] = await db
    .update(users)
    .set({ pushToken: result.data.pushToken, updatedAt: new Date() })
    .where(eq(users.id, authUser.userId))
    .returning();

  if (!updated) {
    return c.json(
      {
        error: {
          code: "USER_NOT_FOUND",
          message: "사용자를 찾을 수 없습니다",
          statusCode: 404,
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: { pushToken: updated.pushToken },
  });
});

export default auth;
