/**
 * Claude Vision 컨디션 분석 서비스
 * Anthropic SDK를 사용하여 얼굴 이미지에서 컨디션을 분석합니다.
 */

import Anthropic from "@anthropic-ai/sdk";

// 컨디션 분석 결과 타입
export interface ConditionAnalysisResult {
  energy: { level: number; confidence: number };
  mood: {
    value: "HAPPY" | "CALM" | "SAD" | "STRESSED" | "TIRED";
    confidence: number;
  };
  stress: { level: number; confidence: number };
  sleep: { quality: "GOOD" | "FAIR" | "POOR"; confidence: number };
  facialTension: {
    forehead: { level: number; confidence: number };
    jaw: { level: number; confidence: number };
    asymmetry: {
      value: "NONE" | "MILD_LEFT" | "MILD_RIGHT" | "MODERATE";
      confidence: number;
    };
  };
  swelling: { level: "NONE" | "MILD" | "MODERATE"; confidence: number };
  skin: {
    pallor: { value: boolean; confidence: number };
    flushed: { value: boolean; confidence: number };
  };
  summary: string;
  exerciseNote: string;
}

// tool_use를 위한 JSON 스키마
const conditionToolSchema: Anthropic.Tool = {
  name: "report_condition",
  description:
    "분석된 컨디션 결과를 구조화된 JSON으로 보고합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      energy: {
        type: "object",
        properties: {
          level: {
            type: "number",
            description: "에너지 수준 (1-10, 1=매우 낮음, 10=매우 높음)",
          },
          confidence: {
            type: "number",
            description: "분석 신뢰도 (0-1)",
          },
        },
        required: ["level", "confidence"],
      },
      mood: {
        type: "object",
        properties: {
          value: {
            type: "string",
            enum: ["HAPPY", "CALM", "SAD", "STRESSED", "TIRED"],
            description: "감정 상태",
          },
          confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
        },
        required: ["value", "confidence"],
      },
      stress: {
        type: "object",
        properties: {
          level: {
            type: "number",
            description: "스트레스 수준 (1-10, 1=매우 낮음, 10=매우 높음)",
          },
          confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
        },
        required: ["level", "confidence"],
      },
      sleep: {
        type: "object",
        properties: {
          quality: {
            type: "string",
            enum: ["GOOD", "FAIR", "POOR"],
            description: "수면 상태 추정",
          },
          confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
        },
        required: ["quality", "confidence"],
      },
      facialTension: {
        type: "object",
        properties: {
          forehead: {
            type: "object",
            properties: {
              level: { type: "number", description: "이마 긴장도 (1-10)" },
              confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
            },
            required: ["level", "confidence"],
          },
          jaw: {
            type: "object",
            properties: {
              level: { type: "number", description: "턱 긴장도 (1-10)" },
              confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
            },
            required: ["level", "confidence"],
          },
          asymmetry: {
            type: "object",
            properties: {
              value: {
                type: "string",
                enum: ["NONE", "MILD_LEFT", "MILD_RIGHT", "MODERATE"],
                description: "안면 비대칭 정도",
              },
              confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
            },
            required: ["value", "confidence"],
          },
        },
        required: ["forehead", "jaw", "asymmetry"],
      },
      swelling: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["NONE", "MILD", "MODERATE"],
            description: "부종 정도",
          },
          confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
        },
        required: ["level", "confidence"],
      },
      skin: {
        type: "object",
        properties: {
          pallor: {
            type: "object",
            properties: {
              value: { type: "boolean", description: "창백함 여부" },
              confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
            },
            required: ["value", "confidence"],
          },
          flushed: {
            type: "object",
            properties: {
              value: { type: "boolean", description: "홍조 여부" },
              confidence: { type: "number", description: "분석 신뢰도 (0-1)" },
            },
            required: ["value", "confidence"],
          },
        },
        required: ["pallor", "flushed"],
      },
      summary: {
        type: "string",
        description: "한국어 3-4문장 컨디션 요약",
      },
      exerciseNote: {
        type: "string",
        description: "한국어 운동 권고 사항",
      },
    },
    required: [
      "energy",
      "mood",
      "stress",
      "sleep",
      "facialTension",
      "swelling",
      "skin",
      "summary",
      "exerciseNote",
    ],
  },
};

const SYSTEM_PROMPT = `당신은 전문 필라테스 강사이자 건강 분석 전문가입니다.
제공된 얼굴 사진을 분석하여 오늘의 컨디션을 평가합니다.

분석 기준:
- 에너지 수준: 눈의 생기, 표정의 활력, 전반적인 얼굴 톤
- 무드: 표정, 눈매, 입꼬리 등에서 감정 상태 판단
- 스트레스: 미간 주름, 눈 주위 긴장, 전반적 표정 경직도
- 수면 상태: 다크서클, 눈 충혈, 부기, 피부 칙칙함
- 안면 근긴장: 이마 주름, 턱 긴장(이 악물기), 좌우 비대칭
- 부종: 얼굴 전체 부기, 눈 주위 부종
- 피부: 창백함(혈색 부족), 홍조(과도한 붉음)

주의사항:
- 의학적 진단이 아닌 운동 프로그램 조정용 참고 정보입니다.
- 자신감이 낮은 항목은 confidence를 낮게 설정하세요.
- summary와 exerciseNote는 반드시 한국어로 작성하세요.
- summary는 3-4문장으로 오늘의 전반적 컨디션을 설명하세요.
- exerciseNote는 운동 강도/종류에 대한 구체적 권고를 포함하세요.`;

const USER_PROMPT = `이 사람의 현재 컨디션을 분석해주세요. 반드시 report_condition 도구를 사용하여 결과를 보고하세요.`;

/**
 * Claude Vision API로 얼굴 이미지를 분석하여 컨디션 결과를 반환합니다.
 * @param base64Image base64 인코딩된 이미지 문자열 (data URI prefix 없이)
 * @param mediaType 이미지 MIME 타입 (기본: image/jpeg)
 */
export async function analyzeCondition(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg"
): Promise<ConditionAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [conditionToolSchema],
    tool_choice: { type: "tool", name: "report_condition" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: USER_PROMPT,
          },
        ],
      },
    ],
  });

  // tool_use 블록에서 결과 추출
  const toolUseBlock = response.content.find(
    (block) => block.type === "tool_use"
  );

  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Claude Vision API did not return a tool_use response");
  }

  return toolUseBlock.input as ConditionAnalysisResult;
}
