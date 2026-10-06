import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { testEnv } from "@/test/mock-env";

// A plain function (not vi.fn) stands in for the OpenAI call, so we fully
// control how it resolves or rejects.
let respond: () => Promise<unknown>;
const calls: unknown[] = [];

vi.mock("@/config/env", () => ({ getServerEnv: () => ({ ...testEnv, OPENAI_API_KEY: "sk-test" }) }));

vi.mock("openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("openai")>();
  class FakeOpenAI {
    static RateLimitError = actual.default.RateLimitError;
    static APIConnectionError = actual.default.APIConnectionError;
    static APIError = actual.default.APIError;
    responses = {
      create: (body: unknown) => {
        calls.push(body);
        return respond();
      },
    };
  }
  return { default: FakeOpenAI };
});

const { generateStructuredOutput } = await import("./structured-output");

const schema = z.object({ answer: z.string(), confidence: z.number() });
const request = { name: "test", schema, instructions: "Be helpful", input: "Hi" };

describe("generateStructuredOutput", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("returns validated data", async () => {
    respond = async () => ({ output_text: JSON.stringify({ answer: "yes", confidence: 0.9 }) });
    await expect(generateStructuredOutput(request)).resolves.toEqual({ answer: "yes", confidence: 0.9 });
    expect(calls[0]).toMatchObject({ model: "test-model", text: { format: { type: "json_schema" } } });
  });

  it("rejects output that isn't JSON", async () => {
    respond = async () => ({ output_text: "Sure! Here's your plan:" });
    await expect(generateStructuredOutput(request)).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });

  it("rejects JSON that doesn't match the schema", async () => {
    respond = async () => ({ output_text: JSON.stringify({ answer: 42 }) });
    await expect(generateStructuredOutput(request)).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });

  it("maps provider failures to friendly errors", async () => {
    respond = async () => {
      throw new TypeError("socket hang up");
    };
    const error = await generateStructuredOutput(request).then(
      () => null,
      (caught: { code: string; userMessage: string }) => caught,
    );
    expect(error?.code).toBe("AI_UNAVAILABLE");
    expect(error?.userMessage).toBe("The AI service had a problem. Please try again.");
  });
});
