/**
 * 시퀀스 생성 서비스 (Mock)
 * 나중에 Anthropic Claude Text API로 교체 가능
 */

interface CatalogExercise {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  difficulty: string;
  equipment: string | null;
  muscleGroups: string[];
  contraindications: string[];
  durationSeconds: number | null;
  description: string | null;
  isActive: boolean | null;
}

interface ConditionFinal {
  energy?: { level: number; confidence?: number };
  stress?: { level: number; confidence?: number };
  sleep?: { quality: string; confidence?: number };
  mood?: { value: string; confidence?: number };
  summary?: string;
  [key: string]: unknown;
}

interface MemberProfile {
  id: string;
  name: string;
  bodyConditions: string[];
  exercisePreferences: Record<string, unknown>;
  fitnessLevel: string;
}

interface SequenceExercise {
  catalogId: string;
  name: string;
  nameKo: string;
  category: string;
  equipment: string;
  sets: number;
  reps: number;
  durationSeconds: number;
  order: number;
  reason: string;
}

interface GeneratedSequence {
  exercises: SequenceExercise[];
  totalDurationMinutes: number;
  difficulty: string;
  focusAreas: string[];
  sequenceNote: string;
}

// 카테고리별 워밍업/쿨다운 분류
const WARMUP_CATEGORIES = ["breathing", "stretching"];
const COOLDOWN_CATEGORIES = ["stretching", "breathing"];
const MAIN_CATEGORIES = ["core", "flexibility", "upper_body", "lower_body", "balance", "posture", "strength"];

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateSequence(
  member: MemberProfile,
  conditionFinal: ConditionFinal | null,
  requestedCategories: string[],
  catalog: CatalogExercise[]
): GeneratedSequence {
  // 1. 활성 운동만 필터
  let available = catalog.filter((ex) => ex.isActive !== false);

  // 2. 회원 bodyConditions 기반 금기 운동 필터링
  const bodyConditions = (member.bodyConditions || []) as string[];
  if (bodyConditions.length > 0) {
    available = available.filter((ex) => {
      const contras = (ex.contraindications || []) as string[];
      // 회원의 bodyConditions와 운동의 contraindications가 겹치면 제외
      return !contras.some((contra) =>
        bodyConditions.some(
          (cond) =>
            cond.toLowerCase().includes(contra.toLowerCase()) ||
            contra.toLowerCase().includes(cond.toLowerCase())
        )
      );
    });
  }

  // 3. 컨디션 기반 난이도 결정
  const energy = conditionFinal?.energy?.level ?? 5;
  const stress = conditionFinal?.stress?.level ?? 5;
  const sleepQuality = conditionFinal?.sleep?.quality ?? "FAIR";

  let targetDifficulty: string;
  let intensityNote: string;

  if (energy <= 3 || stress >= 8) {
    targetDifficulty = "beginner";
    intensityNote = "에너지가 낮거나 스트레스가 높아 가벼운 운동 위주로 구성했습니다.";
  } else if (energy >= 7 && stress <= 3) {
    targetDifficulty = "advanced";
    intensityNote = "컨디션이 좋아 고강도 운동을 포함했습니다.";
  } else {
    targetDifficulty = "intermediate";
    intensityNote = "오늘 컨디션을 고려하여 중간 강도로 구성했습니다.";
  }

  // 수면 부족 시 고강도 제외
  if (sleepQuality === "POOR") {
    available = available.filter((ex) => ex.difficulty !== "advanced");
    if (targetDifficulty === "advanced") {
      targetDifficulty = "intermediate";
      intensityNote = "수면이 부족하여 고강도 운동을 제외하고 구성했습니다.";
    }
  }

  // 회원 fitnessLevel도 반영
  const memberLevel = member.fitnessLevel || "beginner";
  const difficultyOrder = ["beginner", "intermediate", "advanced"];
  const memberLevelIdx = difficultyOrder.indexOf(memberLevel);
  const targetLevelIdx = difficultyOrder.indexOf(targetDifficulty);
  // 회원 레벨보다 2단계 이상 어려운 운동은 제외
  const maxDifficultyIdx = Math.min(Math.max(memberLevelIdx, targetLevelIdx) + 1, 2);
  available = available.filter(
    (ex) => difficultyOrder.indexOf(ex.difficulty) <= maxDifficultyIdx
  );

  // 4. exercisePreferences 기반 필터링
  const prefs = (member.exercisePreferences || {}) as {
    targetMuscles?: string[];
    avoidExercises?: string[];
    goals?: string[];
    sessionDurationMinutes?: number;
  };

  // 4.1 avoidExercises에 포함된 운동 제외
  if (prefs.avoidExercises && prefs.avoidExercises.length > 0) {
    const avoidSet = new Set(prefs.avoidExercises.map((n) => n.toLowerCase()));
    available = available.filter(
      (ex) =>
        !avoidSet.has(ex.name.toLowerCase()) &&
        !avoidSet.has(ex.nameKo.toLowerCase())
    );
  }

  // 4.2 sessionDurationMinutes 반영
  const sessionDurationMinutes = prefs.sessionDurationMinutes ?? 50;

  // 4.3 카테고리 기반 선택
  const requestedSet = new Set(requestedCategories);

  // 목표 수업 시간
  const TARGET_DURATION_SECONDS = sessionDurationMinutes * 60;
  const REST_BETWEEN_SETS_SECONDS = 15; // 세트 간 휴식

  // 워밍업 운동 선택 (3개, ~7분)
  let warmupPool = available.filter((ex) =>
    WARMUP_CATEGORIES.includes(ex.category)
  );
  if (warmupPool.length === 0) warmupPool = available.slice(0, 5);
  const warmups = shuffleArray(warmupPool).slice(0, 3);

  // 쿨다운 운동 선택 (3개, ~7분)
  let cooldownPool = available.filter(
    (ex) =>
      COOLDOWN_CATEGORIES.includes(ex.category) &&
      !warmups.some((w) => w.id === ex.id)
  );
  if (cooldownPool.length === 0) cooldownPool = available.slice(0, 5);
  const cooldowns = shuffleArray(cooldownPool).slice(0, 3);

  // 메인 운동 선택 (~36분 분량, 동적 개수)
  const usedIds = new Set([
    ...warmups.map((w) => w.id),
    ...cooldowns.map((c) => c.id),
  ]);
  let mainPool = available.filter(
    (ex) => !usedIds.has(ex.id) && MAIN_CATEGORIES.includes(ex.category)
  );

  // requestedCategories가 있으면 해당 카테고리 우선
  let mainCandidates: CatalogExercise[] = [];
  if (requestedSet.size > 0) {
    const preferred = shuffleArray(
      mainPool.filter((ex) => requestedSet.has(ex.category))
    );
    const others = shuffleArray(
      mainPool.filter((ex) => !requestedSet.has(ex.category))
    );
    mainCandidates = [...preferred, ...others];
  } else {
    mainCandidates = shuffleArray(mainPool);
  }

  // 4.5 타겟 근육 기반 우선순위
  const targetMuscles = prefs.targetMuscles;
  if (targetMuscles && targetMuscles.length > 0) {
    const targetSet = new Set(targetMuscles.map((m) => m.toLowerCase()));
    const hasTargetMuscle = (ex: CatalogExercise) =>
      (ex.muscleGroups || []).some((mg) => targetSet.has(mg.toLowerCase()));

    const musclePreferred = mainCandidates.filter(hasTargetMuscle);
    const muscleOthers = mainCandidates.filter((ex) => !hasTargetMuscle(ex));
    mainCandidates = [...musclePreferred, ...muscleOthers];
  }

  // 워밍업+쿨다운 시간 계산
  const warmupCooldownSeconds = [...warmups, ...cooldowns].reduce(
    (sum, ex) => sum + (ex.durationSeconds || 60) * 2, 0
  );
  const remainingSeconds = TARGET_DURATION_SECONDS - warmupCooldownSeconds;

  // 메인 운동을 50분에 맞게 동적으로 선택
  const setsForDifficulty: Record<string, number> = {
    beginner: 2, intermediate: 3, advanced: 4,
  };
  let mainExercises: CatalogExercise[] = [];
  let mainTotalSeconds = 0;

  for (const ex of mainCandidates) {
    const diff = ex.difficulty || targetDifficulty;
    const sets = setsForDifficulty[diff] || 3;
    const exDuration = (ex.durationSeconds || 60) * sets + REST_BETWEEN_SETS_SECONDS * (sets - 1);
    if (mainTotalSeconds + exDuration <= remainingSeconds) {
      mainExercises.push(ex);
      mainTotalSeconds += exDuration;
    }
    if (mainExercises.length >= 14) break; // 최대 14개
  }

  // 최소 8개 보장
  if (mainExercises.length < 8) {
    const remaining = mainCandidates.filter(
      (ex) => !mainExercises.some((m) => m.id === ex.id)
    );
    mainExercises = [
      ...mainExercises,
      ...remaining.slice(0, 8 - mainExercises.length),
    ];
  }

  // 5. 시퀀스 조립
  const allExercises = [...warmups, ...mainExercises, ...cooldowns];
  const focusAreas = [...new Set(allExercises.map((ex) => ex.category))];

  // 타겟 근육이 있으면 focusAreas에 추가
  if (targetMuscles && targetMuscles.length > 0) {
    for (const muscle of targetMuscles) {
      if (!focusAreas.includes(muscle)) {
        focusAreas.push(muscle);
      }
    }
  }

  const setsMap: Record<string, number> = {
    beginner: 2,
    intermediate: 3,
    advanced: 4,
  };
  const repsMap: Record<string, number> = {
    beginner: 8,
    intermediate: 10,
    advanced: 12,
  };

  // 워밍업/쿨다운은 2세트로 고정
  const getExSets = (ex: CatalogExercise, idx: number) => {
    if (idx < warmups.length || idx >= warmups.length + mainExercises.length) {
      return 2; // 워밍업/쿨다운
    }
    const diff = ex.difficulty || targetDifficulty;
    return setsMap[diff] || 3;
  };

  const exercises: SequenceExercise[] = allExercises.map((ex, idx) => {
    const sets = getExSets(ex, idx);
    const diff = ex.difficulty || targetDifficulty;
    const isTargetMuscleMatch =
      targetMuscles &&
      targetMuscles.length > 0 &&
      (ex.muscleGroups || []).some((mg) =>
        targetMuscles.some((tm) => tm.toLowerCase() === mg.toLowerCase())
      );

    let reason: string;
    if (idx < warmups.length) {
      reason = "워밍업: 몸을 부드럽게 풀어주는 운동";
    } else if (idx >= warmups.length + mainExercises.length) {
      reason = "쿨다운: 몸의 긴장을 풀어주는 마무리 운동";
    } else if (isTargetMuscleMatch && requestedSet.has(ex.category)) {
      const matchedMuscles = (ex.muscleGroups || []).filter((mg) =>
        targetMuscles!.some((tm) => tm.toLowerCase() === mg.toLowerCase())
      );
      reason = `요청된 카테고리(${ex.category}) + 타겟 근육(${matchedMuscles.join(", ")}) 운동`;
    } else if (isTargetMuscleMatch) {
      const matchedMuscles = (ex.muscleGroups || []).filter((mg) =>
        targetMuscles!.some((tm) => tm.toLowerCase() === mg.toLowerCase())
      );
      reason = `타겟 근육(${matchedMuscles.join(", ")}) 강화 운동`;
    } else if (requestedSet.has(ex.category)) {
      reason = `요청된 카테고리(${ex.category}) 운동`;
    } else {
      reason = getCategoryReason(ex.category);
    }

    return {
      catalogId: ex.id,
      name: ex.name,
      nameKo: ex.nameKo,
      category: ex.category,
      equipment: ex.equipment || "mat",
      sets,
      reps: repsMap[diff] || 10,
      durationSeconds: ex.durationSeconds || 60,
      order: idx + 1,
      reason,
    };
  });

  // 총 시간: 운동 시간 + 세트 간 휴식
  const totalSeconds = exercises.reduce((sum, ex) => {
    const exerciseTime = ex.durationSeconds * ex.sets;
    const restTime = REST_BETWEEN_SETS_SECONDS * (ex.sets - 1);
    return sum + exerciseTime + restTime;
  }, 0);
  const totalDurationMinutes = Math.round(totalSeconds / 60);

  // 무드 기반 추가 메모
  const mood = conditionFinal?.mood?.value;
  let moodNote = "";
  if (mood === "STRESSED" || mood === "SAD") {
    moodNote = " 호흡 운동을 포함하여 심신 안정에 도움이 되도록 했습니다.";
  } else if (mood === "HAPPY") {
    moodNote = " 좋은 기분을 유지하며 활기찬 운동을 구성했습니다.";
  }

  // 타겟 근육 메모
  let targetMuscleNote = "";
  if (targetMuscles && targetMuscles.length > 0) {
    targetMuscleNote = ` 타겟 근육(${targetMuscles.join(", ")})을 중심으로 운동을 우선 배치했습니다.`;
  }

  // 목표 메모
  let goalsNote = "";
  if (prefs.goals && prefs.goals.length > 0) {
    goalsNote = ` 목표: ${prefs.goals.join(", ")}.`;
  }

  return {
    exercises,
    totalDurationMinutes,
    difficulty: targetDifficulty,
    focusAreas,
    sequenceNote: intensityNote + moodNote + targetMuscleNote + goalsNote,
  };
}

function getCategoryReason(category: string): string {
  const reasons: Record<string, string> = {
    core: "코어 강화 및 안정성 향상",
    flexibility: "유연성 향상 및 관절 가동 범위 확대",
    upper_body: "상체 근력 강화",
    lower_body: "하체 근력 및 안정성 강화",
    balance: "균형감각 향상 및 체간 안정화",
    posture: "자세 교정 및 체형 개선",
    strength: "전신 근력 강화",
    stretching: "근육 이완 및 유연성 향상",
    breathing: "호흡 안정화 및 심신 이완",
  };
  return reasons[category] || "전반적인 신체 기능 향상";
}
