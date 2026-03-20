# Hono v4 + Drizzle ORM + bcrypt + jsonwebtoken 핵심 사용법

---

## 1. Hono v4 프로젝트 셋업

```bash
mkdir my-api && cd my-api
npm init -y
npm install hono @hono/node-server
npm install -D typescript tsx @types/node
npx tsc --init
```

### package.json

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### src/index.ts

```ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/", (c) => c.json({ message: "Hello Hono v4!" }));

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
```

---

## 2. Hono 라우트 정의 및 미들웨어

### 기본 라우트

```ts
app.get("/users", (c) => c.json({ users: [] }));

app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json({ created: body }, 201);
});

app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

app.get("/search", (c) => {
  const q = c.req.query("q");
  return c.json({ query: q });
});
```

### 라우트 그룹화

```ts
const api = new Hono().basePath("/api");
const v1 = new Hono();
v1.get("/users", (c) => c.json({ version: 1 }));
api.route("/v1", v1);
```

### 커스텀 미들웨어

```ts
import { createMiddleware } from "hono/factory";

type Env = { Variables: { userId: string } };

const authMiddleware = createMiddleware<Env>(async (c, next) => {
  c.set("userId", "user-123");
  await next();
});

app.get("/me", authMiddleware, (c) => {
  return c.json({ userId: c.get("userId") });
});
```

### 내장 미들웨어

```ts
import { cors } from "hono/cors";
import { logger } from "hono/logger";

app.use("*", logger());
app.use("/api/*", cors({ origin: "http://localhost:5173", credentials: true }));
```

### 에러 핸들링

```ts
import { HTTPException } from "hono/http-exception";

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));
```

---

## 3. Drizzle ORM PostgreSQL 연결 (Docker)

### 패키지 설치

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

### DB 연결 (src/db/index.ts)

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:password@localhost:5432/pilates";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

### drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL
      || "postgresql://postgres:password@localhost:5432/pilates",
  },
});
```

---

## 4. Drizzle 스키마 정의

```ts
import {
  pgTable, uuid, text, varchar, integer, boolean,
  timestamp, jsonb, pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum
export const userRoleEnum = pgEnum("user_role", ["instructor", "member"]);

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  pushToken: text("push_token"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Members
export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  bodyConditions: jsonb("body_conditions").$type<Array<{
    type: string; area: string; severity: string; notes?: string;
  }>>().default([]),
  exercisePreferences: jsonb("exercise_preferences").$type<{
    preferredEquipment: string[];
    avoidExercises: string[];
    goals: string[];
    sessionDurationMinutes: number;
  }>().default({}),
  fitnessLevel: text("fitness_level").default("beginner").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  member: one(members, { fields: [users.id], references: [members.userId] }),
}));

// 타입 추출
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
```

---

## 5. Drizzle 마이그레이션

```bash
# SQL 마이그레이션 파일 생성
npx drizzle-kit generate

# 마이그레이션 적용 (프로덕션)
npx drizzle-kit migrate

# 스키마 직접 푸시 (개발용, 마이그레이션 파일 없이)
npx drizzle-kit push

# DB 뷰어
npx drizzle-kit studio
```

| 명령어 | 용도 | 마이그레이션 파일 |
|--------|------|-------------------|
| `generate` | 스키마 변경 → SQL 파일 생성 | O |
| `migrate` | SQL 파일을 DB에 적용 | - |
| `push` | 스키마 직접 반영 (개발용) | X |
| `studio` | 브라우저 DB 뷰어 | - |

---

## 6. Drizzle CRUD 쿼리 패턴

```ts
import { eq, and, like, desc, sql, inArray } from "drizzle-orm";
```

### SELECT

```ts
const allUsers = await db.select().from(users);

const activeMembers = await db.select().from(users)
  .where(and(eq(users.role, "member"), eq(users.isActive, true)));

const page = await db.select().from(users)
  .orderBy(desc(users.createdAt))
  .limit(10).offset(0);

// 단일 행
const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
```

### INSERT

```ts
const [newUser] = await db.insert(users).values({
  email: "user@example.com",
  passwordHash: hashedPassword,
  name: "홍길동",
  role: "member",
}).returning();
```

### UPDATE

```ts
const [updated] = await db.update(users)
  .set({ name: "김철수", updatedAt: new Date() })
  .where(eq(users.id, userId))
  .returning();
```

### DELETE

```ts
const [deleted] = await db.delete(users)
  .where(eq(users.id, userId))
  .returning();
```

### JOIN

```ts
const sessionsWithDetails = await db
  .select({
    sessionId: sessions.id,
    memberName: members.name,
    date: sessions.date,
  })
  .from(sessions)
  .innerJoin(members, eq(sessions.memberId, members.id));
```

### Relational Query (db.query)

```ts
const userWithMember = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { member: true },
});
```

---

## 7. bcrypt 비밀번호 해싱/검증

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

```ts
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

---

## 8. jsonwebtoken JWT 발급/검증

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

### JWT 유틸리티 (src/lib/jwt.ts)

```ts
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

export interface TokenPayload { userId: string; role: string; }

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ userId: payload.userId, type: "refresh" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & TokenPayload;
  return { userId: decoded.userId, role: decoded.role };
}
```

---

## 9. Hono JWT 인증 미들웨어

### src/middleware/auth.ts

```ts
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verifyToken, TokenPayload } from "../lib/jwt";

type AuthEnv = { Variables: { user: TokenPayload } };

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing Authorization header" });
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    c.set("user", payload);
    await next();
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
});

export const requireRole = (...roles: string[]) => {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }
    await next();
  });
};
```

### 적용 예시

```ts
// 공개 라우트
app.post("/auth/login", async (c) => { /* ... */ });
app.post("/auth/register", async (c) => { /* ... */ });

// 보호된 라우트
app.use("/api/*", authMiddleware);

app.get("/api/me", async (c) => {
  const { userId } = c.get("user");
  // ...
});

app.get("/api/admin/users", requireRole("instructor"), async (c) => {
  // 강사만 접근 가능
});
```

---

## 패키지 요약

```bash
# 프로덕션
npm install hono @hono/node-server drizzle-orm postgres bcrypt jsonwebtoken

# 개발
npm install -D typescript tsx @types/node @types/bcrypt @types/jsonwebtoken drizzle-kit
```
