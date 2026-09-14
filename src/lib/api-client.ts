import type { ApiErrorCode, ApiIssue, ApiResponse } from "@/lib/api-response";

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ApiIssue[],
  ) {
    super(message);
  }
}

type FetchOptions = Omit<RequestInit, "body"> & { json?: unknown };

/**
 * Typed fetch for our envelope. Resolves to `{ data, meta }` or throws an
 * ApiClientError carrying the server's message, so the UI can show it as-is.
 */
export async function apiFetch<T, M = undefined>(url: string, options: FetchOptions = {}): Promise<{ data: T; meta: M }> {
  const { json, headers, ...rest } = options;
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: json === undefined ? headers : { "Content-Type": "application/json", ...headers },
      body: json === undefined ? undefined : JSON.stringify(json),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError(0, "INTERNAL", "We couldn't reach the server. Check your connection and try again.");
  }

  let body: ApiResponse<T, M>;
  try {
    body = (await response.json()) as ApiResponse<T, M>;
  } catch {
    throw new ApiClientError(response.status, "INTERNAL", "The server sent a response we couldn't read. Try again.");
  }
  if (!body.ok) throw new ApiClientError(response.status, body.error.code, body.error.message, body.error.details);
  return { data: body.data, meta: body.meta as M };
}
