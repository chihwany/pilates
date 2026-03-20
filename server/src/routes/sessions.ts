import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import {
  weeklySchedules,
  members,
  sessions,
  exerciseSequences,
} from "../db/schema";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthUser } from "../middleware/auth";

const sessionsRouter = new Hono();

// 모든 라우트에 인증 필요
sessionsRouter.use("*", authMiddleware);

// GET /api/sessions/today-dashboard - 강사 대시보드용 오늘 통합 조회
sessionsRouter.get(
  "/today-dashboard",
  requireRole("instructor"),
  async (c) => {
    const authUser = c.get("user") as AuthUser;

    // 오늘 날짜 (Asia/Seoul)
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    );
    const todayStr = now.toISOString().split("T")[0]!;
    const dayOfWeek = now.getDay(); // 0=일~6=토

    // 오늘 요일의 활성 스케줄 조회 (강사 기준)
    const todaySchedules = await db
      .select({
        schedule: weeklySchedules,
        memberName: members.name,
        memberId: members.id,
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

    // 각 스케줄 회원에 대해 세션 + 시퀀스 정보 조회
    const sessionsList = await Promise.all(
      todaySchedules.map(async (row) => {
        const memberId = row.schedule.memberId;
        const memberName = row.memberName ?? "알 수 없음";
        const startTime = row.schedule.startTime;

        // 오늘 세션 찾기
        const [session] = await db
          .select()
          .from(sessions)
          .where(
            and(eq(sessions.memberId, memberId), eq(sessions.date, todayStr))
          )
          .limit(1);

        if (!session) {
          // 스케줄은 있지만 세션 없음 (컨디션 미체크)
          return {
            memberId,
            memberName,
            startTime,
            conditionChecked: false,
            conditionSummary: null,
            sequenceGenerated: false,
            sequenceId: null,
            sessionId: null,
            difficulty: null,
            exerciseCount: null,
            totalDurationMinutes: null,
            wasModified: false,
          };
        }

        // 시퀀스 찾기
        const [sequence] = await db
          .select()
          .from(exerciseSequences)
          .where(eq(exerciseSequences.sessionId, session.id))
          .limit(1);

        // 컨디션 요약 구성
        let conditionSummary: string | null = null;
        if (session.conditionFinal) {
          const cf = session.conditionFinal as Record<string, unknown>;
          const parts: string[] = [];
          if (cf.energy !== undefined) parts.push(`에너지 ${cf.energy}`);
          if (cf.mood) parts.push(`무드 ${cf.mood}`);
          if (session.memberNote) parts.push(`메모: ${session.memberNote}`);
          conditionSummary = parts.length > 0 ? parts.join(", ") : null;
        }

        const exercisesArr = sequence
          ? (sequence.exercises as unknown[])
          : null;

        return {
          memberId,
          memberName,
          startTime,
          conditionChecked: !!session.conditionCheckedAt,
          conditionSummary,
          sequenceGenerated: !!sequence,
          sequenceId: sequence?.id ?? null,
          sessionId: session.id,
          difficulty: sequence?.difficulty ?? null,
          exerciseCount: exercisesArr ? exercisesArr.length : null,
          totalDurationMinutes: sequence?.totalDurationMinutes ?? null,
          wasModified: sequence?.wasModified ?? false,
        };
      })
    );

    const totalMembers = sessionsList.length;
    const conditionChecked = sessionsList.filter(
      (s) => s.conditionChecked
    ).length;
    const sequenceGenerated = sessionsList.filter(
      (s) => s.sequenceGenerated
    ).length;

    return c.json({
      success: true,
      data: {
        date: todayStr,
        totalMembers,
        conditionChecked,
        sequenceGenerated,
        sessions: sessionsList,
      },
    });
  }
);

export default sessionsRouter;
