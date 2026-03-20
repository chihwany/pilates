import { z } from "zod";

// ===== 인증 =====

export const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .max(100),
  name: z.string().min(1, "이름을 입력하세요").max(100),
  role: z.enum(["instructor", "member"]).default("member"),
});

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "리프레시 토큰이 필요합니다"),
});

export const pushTokenSchema = z.object({
  pushToken: z.string().min(1, "푸시 토큰이 필요합니다"),
});

// ===== 회원 =====

export const createMemberSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(100),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bodyConditions: z.array(z.unknown()).optional().default([]),
  exercisePreferences: z.record(z.unknown()).optional().default({}),
  fitnessLevel: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional()
    .default("beginner"),
  notes: z.string().optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bodyConditions: z.array(z.unknown()).optional(),
  exercisePreferences: z.record(z.unknown()).optional(),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  notes: z.string().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type PushTokenInput = z.infer<typeof pushTokenSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
