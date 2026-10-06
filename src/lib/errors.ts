/**
 * Errors we expect and know how to explain to the user. Anything else is
 * treated as unexpected: logged with context and shown as a generic message.
 */
export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "AI_INVALID_OUTPUT"
  | "CONFLICT";

export class AppError extends Error {
  readonly code: AppErrorCode;
  /** Safe to show to the user. */
  readonly userMessage: string;

  constructor(code: AppErrorCode, userMessage: string, options?: { cause?: unknown }) {
    super(userMessage, options);
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

export class UnauthenticatedError extends AppError {
  constructor() {
    super("UNAUTHENTICATED", "Your session has expired. Please sign in again.");
  }
}

export class NotFoundError extends AppError {
  constructor(what: string) {
    super("NOT_FOUND", `We couldn't find that ${what}. It may have been deleted.`);
  }
}

export class ValidationError extends AppError {
  constructor(userMessage = "Some of the information wasn't valid. Please check and try again.") {
    super("VALIDATION", userMessage);
  }
}
