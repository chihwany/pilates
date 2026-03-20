import type { Context, Next } from "hono";
import { verifyToken } from "../lib/jwt";

export interface AuthUser {
  userId: string;
  role: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "인증이 필요합니다",
          statusCode: 401,
        },
      },
      401
    );
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    c.set("user", { userId: payload.userId, role: payload.role });
    await next();
  } catch {
    return c.json(
      {
        error: {
          code: "INVALID_TOKEN",
          message: "유효하지 않거나 만료된 토큰입니다",
          statusCode: 401,
        },
      },
      401
    );
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      return c.json(
        {
          error: {
            code: "AUTH_REQUIRED",
            message: "인증이 필요합니다",
            statusCode: 401,
          },
        },
        401
      );
    }

    if (!roles.includes(user.role)) {
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

    await next();
  };
}
