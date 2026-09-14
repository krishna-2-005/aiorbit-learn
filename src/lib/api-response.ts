import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "FORBIDDEN"
  | "INTERNAL";

export type ApiIssue = { path: string; message: string };

export type ApiSuccess<T, M = undefined> = { ok: true; data: T; meta?: M };
export type ApiFailure = {
  ok: false;
  error: { code: ApiErrorCode; message: string; details?: ApiIssue[]; fieldErrors?: Record<string, string> };
};
export type ApiResponse<T, M = undefined> = ApiSuccess<T, M> | ApiFailure;

/** Thrown anywhere below a route handler; `route()` turns it into the error envelope. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ApiIssue[],
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: ApiIssue[]) =>
  new ApiError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Log in to do this.") => new ApiError(401, "UNAUTHORIZED", message);
export const notFound = (message: string) => new ApiError(404, "NOT_FOUND", message);
export const conflict = (message: string) => new ApiError(409, "CONFLICT", message);

export function ok<T, M = undefined>(data: T, meta?: M, init?: ResponseInit) {
  const body: ApiSuccess<T, M> = meta === undefined ? { ok: true, data } : { ok: true, data, meta };
  return NextResponse.json(body, init);
}

export function fail(status: number, code: ApiErrorCode, message: string, details?: ApiIssue[]) {
  const fieldErrors = details ? Object.fromEntries(details.map((issue) => [issue.path, issue.message])) : undefined;
  const body: ApiFailure = { ok: false, error: details ? { code, message, details, fieldErrors } : { code, message } };
  return NextResponse.json(body, { status });
}

function issuesOf(error: ZodError): ApiIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

type Handler<Ctx> = (request: NextRequest, context: Ctx) => Promise<Response>;

/**
 * Wraps a route handler: known errors become their envelope, anything else is logged
 * and returned as a generic 500 so Prisma and stack details never reach the client.
 */
export function route<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) return fail(error.status, error.code, error.message, error.details);
      if (error instanceof ZodError) {
        const issues = issuesOf(error);
        return fail(400, "BAD_REQUEST", validationMessage(issues), issues);
      }
      console.error(`[api] ${request.method} ${request.nextUrl.pathname}`, error);
      return fail(500, "INTERNAL", "The server hit an unexpected error. Try again in a moment.");
    }
  };
}

function validationMessage(issues: ApiIssue[]): string {
  // One problem: say it directly. Several: summarise; each is in details.
  return issues.length === 1 && issues[0] ? issues[0].message : `${issues.length} values are invalid. See details.`;
}

/** Parse with a zod schema or throw a 400 with field-level details. */
export function parseWith<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issues = issuesOf(result.error);
    throw badRequest(validationMessage(issues), issues);
  }
  return result.data;
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest("The request body must be valid JSON.");
  }
}
