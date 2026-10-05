import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";

import { getServerEnv } from "@/config/env";
import { AppError } from "@/lib/errors";

let client: OpenAI | undefined;

/** Whether a real AI provider is configured. Without one, features use offline fallbacks. */
export function isAiConfigured(): boolean {
  return Boolean(getServerEnv().OPENAI_API_KEY);
}

function getClient(): OpenAI {
  const { OPENAI_API_KEY } = getServerEnv();
  if (!OPENAI_API_KEY) {
    throw new AppError("AI_UNAVAILABLE", "AI isn't configured for this workspace.");
  }
  client ??= new OpenAI({ apiKey: OPENAI_API_KEY, timeout: 45_000, maxRetries: 1 });
  return client;
}

type StructuredRequest<Schema extends z.ZodType> = {
  /** Short identifier used for the JSON schema name and logs. */
  name: string;
  /** Describes the shape we ask the model for. */
  schema: Schema;
  instructions: string;
  input: string;
};

/**
 * Asks the model for JSON matching `schema` and validates the reply with Zod.
 * The model's output is untrusted: if it doesn't parse or validate, callers
 * get an AppError and nothing downstream ever sees the raw text.
 */
export async function generateStructuredOutput<Schema extends z.ZodType>(
  request: StructuredRequest<Schema>,
): Promise<z.output<Schema>> {
  const { OPENAI_MODEL } = getServerEnv();

  let outputText: string;
  try {
    const response = await getClient().responses.create({
      model: OPENAI_MODEL,
      instructions: request.instructions,
      input: request.input,
      text: { format: zodTextFormat(request.schema, request.name) },
    });
    outputText = response.output_text;
  } catch (error) {
    throw toAppError(error);
  }

  let json: unknown;
  try {
    json = JSON.parse(outputText);
  } catch (error) {
    throw new AppError("AI_INVALID_OUTPUT", "The AI returned something we couldn't read. Please try again.", {
      cause: error,
    });
  }

  const result = request.schema.safeParse(json);
  if (!result.success) {
    throw new AppError("AI_INVALID_OUTPUT", "The AI returned something we couldn't use. Please try again.", {
      cause: result.error.issues,
    });
  }
  return result.data;
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof OpenAI.RateLimitError) {
    return new AppError("RATE_LIMITED", "The AI is busy right now. Please try again in a minute.", {
      cause: error,
    });
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new AppError(
      "AI_UNAVAILABLE",
      "We couldn't reach the AI service. Check your connection and try again.",
      {
        cause: error,
      },
    );
  }
  if (error instanceof OpenAI.APIError) {
    // Log the status only — error bodies can echo request content.
    return new AppError("AI_UNAVAILABLE", "The AI service had a problem. Please try again.", {
      cause: `OpenAI API error ${error.status ?? "unknown"}`,
    });
  }
  return new AppError("AI_UNAVAILABLE", "The AI service had a problem. Please try again.", { cause: error });
}
