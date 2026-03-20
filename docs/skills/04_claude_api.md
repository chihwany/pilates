# Anthropic Claude API (Vision + Text) 핵심 사용법

---

## 1. Anthropic SDK 설치 및 초기화

```bash
npm install @anthropic-ai/sdk
```

```typescript
import Anthropic from "@anthropic-ai/sdk";

// 환경변수 ANTHROPIC_API_KEY 자동 사용
const client = new Anthropic();

// 또는 명시적 전달
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

---

## 2. Claude Text API 호출

### 기본 호출

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "필라테스의 기본 원칙 6가지를 설명해줘." },
  ],
});

console.log(message.content[0].text);
```

### System Prompt 사용

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: "당신은 전문 필라테스 강사입니다. 운동 시퀀스를 JSON 형태로 반환하세요.",
  messages: [
    { role: "user", content: "초급자를 위한 10분 매트 필라테스 시퀀스를 만들어줘." },
  ],
});
```

### Multi-turn 대화

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "허리 통증에 좋은 필라테스 동작은?" },
    { role: "assistant", content: "허리 통증 완화에 효과적인 동작으로는 Pelvic Tilt, Cat-Cow..." },
    { role: "user", content: "그 중 Pelvic Tilt의 정확한 수행 방법을 알려줘." },
  ],
});
```

---

## 3. Claude Vision API 호출

### Base64 이미지 전송

```typescript
import fs from "fs";

const imageBuffer = fs.readFileSync("./face.jpg");
const base64Image = imageBuffer.toString("base64");

const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: base64Image,
          },
        },
        {
          type: "text",
          text: "이 사진의 인물의 컨디션을 분석해줘.",
        },
      ],
    },
  ],
});
```

### URL 이미지 전송

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "url",
            url: "https://example.com/face.jpg",
          },
        },
        { type: "text", text: "컨디션을 분석해줘." },
      ],
    },
  ],
});
```

> **이미지 제한**: 최대 5MB, 한 요청당 최대 20개. JPEG, PNG, GIF, WebP 지원.

---

## 4. 구조화된 JSON 응답 요청 패턴

### 방법 1: Tool Use (권장)

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  tools: [
    {
      name: "analyze_condition",
      description: "얼굴 사진에서 컨디션을 분석합니다.",
      input_schema: {
        type: "object",
        properties: {
          energy: {
            type: "object",
            properties: {
              level: { type: "number", minimum: 1, maximum: 10 },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["level", "confidence"],
          },
          mood: {
            type: "object",
            properties: {
              value: { type: "string", enum: ["HAPPY", "CALM", "SAD", "STRESSED", "TIRED"] },
              confidence: { type: "number" },
            },
            required: ["value", "confidence"],
          },
          summary: { type: "string" },
        },
        required: ["energy", "mood", "summary"],
      },
    },
  ],
  tool_choice: { type: "tool", name: "analyze_condition" },
  messages: [
    {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Image } },
        { type: "text", text: "이 사진의 인물의 컨디션을 분석해주세요." },
      ],
    },
  ],
});

// 구조화된 JSON 추출
const toolUseBlock = message.content.find((block) => block.type === "tool_use");
const conditionData = toolUseBlock.input;
console.log(JSON.stringify(conditionData, null, 2));
```

### 방법 2: 프롬프트 기반 JSON 요청

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: `반드시 순수 JSON만 반환하세요. 다른 텍스트 없이.`,
  messages: [{ role: "user", content: "어깨 스트레칭 3가지를 추천해줘." }],
});

try {
  const data = JSON.parse(message.content[0].text);
} catch (e) {
  console.error("JSON 파싱 실패:", e);
}
```

> **권장**: 안정적 구조화 출력은 `tool_use` + `tool_choice` 패턴 사용.

---

## 5. 에러 핸들링

```typescript
import Anthropic from "@anthropic-ai/sdk";

async function callClaude(userMessage: string) {
  try {
    return await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("Rate limit 초과. 재시도 필요.");
      const retryAfter = error.headers?.["retry-after"] ?? 60;
      await new Promise((r) => setTimeout(r, Number(retryAfter) * 1000));
      return callClaude(userMessage);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("인증 실패. API 키 확인 필요.");
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("잘못된 요청:", error.message);
    }
    throw error;
  }
}
```

### 지수 백오프 재시도

```typescript
async function callWithRetry(userMessage: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: userMessage }],
      });
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("최대 재시도 횟수 초과");
}
```

> SDK는 기본적으로 429, 5xx에 대해 자동 2회 재시도. `new Anthropic({ maxRetries: 5 })`로 조절 가능.

---

## 6. 스트리밍 응답 처리

```typescript
const stream = client.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "전신 필라테스 30분 프로그램을 작성해줘." }],
});

stream.on("text", (text) => {
  process.stdout.write(text);
});

const finalMessage = await stream.finalMessage();
console.log("Total tokens:", finalMessage.usage);
```

### async iterator 방식

```typescript
for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
}
```

---

## 7. 모델 선택 가이드

| 모델 | ID | 특징 | 용도 |
|------|-----|------|------|
| **Opus 4** | `claude-opus-4-20250514` | 최고 성능 | 고난도 분석, 연구 |
| **Sonnet 4** | `claude-sonnet-4-20250514` | 성능/속도/비용 균형 | 대부분의 프로덕션 |
| **Haiku 3.5** | `claude-3-5-haiku-20241022` | 가장 빠르고 저렴 | 분류, 간단한 Q&A |

모든 모델: **200K 토큰** 입력 컨텍스트.

---

## 8. 비용 최적화 팁

### 모델 티어링

```typescript
function selectModel(task: "classify" | "generate" | "analyze"): string {
  switch (task) {
    case "classify": return "claude-3-5-haiku-20241022";
    case "generate": return "claude-sonnet-4-20250514";
    case "analyze":  return "claude-opus-4-20250514";
  }
}
```

### Prompt Caching (시스템 프롬프트 1024토큰 이상 시 활성화, 90% 할인)

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: "당신은 필라테스 전문가입니다... (긴 시스템 프롬프트)",
      cache_control: { type: "ephemeral" },
    },
  ],
  messages: [{ role: "user", content: "오늘의 추천 운동은?" }],
});
```

### 이미지 비용 절감

```typescript
import sharp from "sharp";

async function optimizeImage(imagePath: string): Promise<string> {
  const buffer = await sharp(imagePath)
    .resize(768, 768, { fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer();
  return buffer.toString("base64");
}
```

> 이미지 토큰: 대략 `(width * height) / 750`. 1568px 이상은 자동 리사이즈됨.

### 토큰 사용량 모니터링

```typescript
console.log("입력:", message.usage.input_tokens);
console.log("출력:", message.usage.output_tokens);
console.log("캐시:", message.usage.cache_read_input_tokens ?? 0);
```

---

## 요약

| 항목 | 권장 |
|------|------|
| SDK 초기화 | 환경변수 `ANTHROPIC_API_KEY` |
| 구조화 출력 | `tool_use` + `tool_choice` |
| 이미지 분석 | base64, 리사이즈로 비용 절감 |
| 에러 처리 | SDK 에러 클래스 + 지수 백오프 |
| 스트리밍 | `messages.stream()` |
| 비용 절감 | 모델 티어링 + Prompt Caching |
