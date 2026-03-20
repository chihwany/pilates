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
  // bodyConditions는 두 가지 형태 가능:
  // - string[] (단순 문자열 배열): ["측만증", "허리디스크"]
  // - object[] (구조화된 객체 배열): [{type:"측만증", area:"허리", severity:"moderate"}]
  const rawConditions = (member.bodyConditions || []) as unknown[];
  const conditionStrings: string[] = rawConditions.flatMap((cond) => {
    if (typeof cond === "string") return [cond];
    if (typeof cond === "object" && cond !== null) {
      const obj = cond as Record<string, unknown>;
      // type과 area를 모두 매칭 대상으로 사용
      return [obj.type, obj.area].filter((v): v is string => typeof v === "string");
    }
    return [];
  });

  if (conditionStrings.length > 0) {
    available = available.filter((ex) => {
      const contras = (ex.contraindications || []) as string[];
      return !contras.some((contra) =>
        conditionStrings.some(
          (cond) =>
            cond.toLowerCase().includes(contra.toLowerCase()) ||
            contra.toLowerCase().includes(cond.toLowerCase())
        )
      );
    });
  }

  // 3. 컨디션 기반 난이도 결정
  // conditionFinal은 두 가지 형식 가능:
  // - {energy: 7, stress: 3, sleep: "GOOD"} (프론트에서 수정 후)
  // - {energy: {level: 7}, stress: {level: 3}, sleep: {quality: "GOOD"}} (AI 원본)
  const cf = conditionFinal as Record<string, unknown> | null;
  const energy = typeof cf?.energy === "number" ? cf.energy : (cf?.energy as any)?.level ?? 5;
  const stress = typeof cf?.stress === "number" ? cf.stress : (cf?.stress as any)?.level ?? 5;
  const sleepQuality = typeof cf?.sleep === "string" ? cf.sleep : (cf?.sleep as any)?.quality ?? "FAIR";

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
    isPrenatal?: boolean;
    isPostnatal?: boolean;
  };

  // 4.0 산전/산후 카테고리 필터링
  const isPrenatal = prefs.isPrenatal === true;
  const isPostnatal = prefs.isPostnatal === true;

  if (!isPrenatal) {
    // 산전 회원이 아니면 prenatal 카테고리 운동 제외
    available = available.filter((ex) => ex.category !== "prenatal");
  }
  if (!isPostnatal) {
    // 산후 회원이 아니면 postnatal 카테고리 운동 제외
    available = available.filter((ex) => ex.category !== "postnatal");
  }

  // 산전 회원: 고강도/앙와위 위험 운동 제외, prenatal 카테고리 우선
  if (isPrenatal) {
    available = available.filter((ex) => ex.difficulty !== "advanced");
    // prenatal을 요청 카테고리에 자동 추가
    if (!requestedCategories.includes("prenatal")) {
      requestedCategories = [...requestedCategories, "prenatal"];
    }
  }

  // 산후 회원: postnatal 카테고리 우선
  if (isPostnatal) {
    if (!requestedCategories.includes("postnatal")) {
      requestedCategories = [...requestedCategories, "postnatal"];
    }
  }

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

  // 목표 수업 시간 & 운동 수
  const TARGET_DURATION_SECONDS = sessionDurationMinutes * 60;
  const REST_BETWEEN_SETS_SECONDS = 30; // 세트 간 휴식 + 전환 시간
  const TARGET_EXERCISE_COUNT = 8; // 목표 운동 수 (워밍업 1 + 메인 6 + 쿨다운 1)

  // 워밍업 운동 선택 (1개, ~6분)
  let warmupPool = available.filter((ex) =>
    WARMUP_CATEGORIES.includes(ex.category)
  );
  if (warmupPool.length === 0) warmupPool = available.slice(0, 5);
  const warmups = shuffleArray(warmupPool).slice(0, 1);

  // 쿨다운 운동 선택 (1개, ~6분)
  let cooldownPool = available.filter(
    (ex) =>
      COOLDOWN_CATEGORIES.includes(ex.category) &&
      !warmups.some((w) => w.id === ex.id)
  );
  if (cooldownPool.length === 0) cooldownPool = available.slice(0, 5);
  const cooldowns = shuffleArray(cooldownPool).slice(0, 1);

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

  // 메인 운동 6개 선택 (워밍업2 + 메인6 + 쿨다운2 = 10개)
  const mainTargetCount = TARGET_EXERCISE_COUNT - warmups.length - cooldowns.length;
  const setsForDifficulty: Record<string, number> = {
    beginner: 3, intermediate: 4, advanced: 5,
  };
  let mainExercises = mainCandidates.slice(0, mainTargetCount);

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
    beginner: 4,
    intermediate: 5,
    advanced: 5,
  };
  const repsMap: Record<string, number> = {
    beginner: 10,
    intermediate: 12,
    advanced: 15,
  };

  // 워밍업/쿨다운은 3세트, 메인은 난이도별 세트
  const getExSets = (ex: CatalogExercise, idx: number) => {
    if (idx < warmups.length || idx >= warmups.length + mainExercises.length) {
      return 3; // 워밍업/쿨다운
    }
    const diff = ex.difficulty || targetDifficulty;
    return setsMap[diff] || 5;
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

    // 운동당 목표 시간 = 총 시간 / 운동 수 (휴식 포함)
    const targetPerExercise = Math.floor(TARGET_DURATION_SECONDS / allExercises.length);
    const baseDuration = ex.durationSeconds || 60;
    // 세트당 시간 = (운동당 목표 시간 - 세트간 휴식) / 세트 수
    const restTotal = REST_BETWEEN_SETS_SECONDS * (sets - 1);
    const targetDurationPerSet = Math.floor((targetPerExercise - restTotal) / sets);
    const adjustedDuration = Math.max(baseDuration, Math.min(targetDurationPerSet, 120));

    return {
      catalogId: ex.id,
      name: ex.name,
      nameKo: ex.nameKo,
      category: ex.category,
      equipment: ex.equipment || "mat",
      sets,
      reps: repsMap[diff] || 12,
      durationSeconds: adjustedDuration,
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

  // 산전/산후 메모
  let specialNote = "";
  if (isPrenatal) {
    specialNote = " 산전 회원을 위해 안전한 운동 위주로 구성했습니다. 고강도 운동은 제외되었습니다.";
  } else if (isPostnatal) {
    specialNote = " 산후 회복을 위한 운동이 포함되었습니다. 골반저근 및 코어 회복에 중점을 두었습니다.";
  }

  return {
    exercises,
    totalDurationMinutes,
    difficulty: targetDifficulty,
    focusAreas,
    sequenceNote: intensityNote + moodNote + targetMuscleNote + goalsNote + specialNote,
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
