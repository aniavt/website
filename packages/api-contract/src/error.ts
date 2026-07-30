export interface ApiErrorBody {
  readonly error: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Call when !res.ok. Parses { error }, fallback "unknown_error". */
export async function throwApiError(res: Response): Promise<never> {
  const data = (await res.json().catch(() => ({
    error: "unknown_error",
  }))) as Partial<ApiErrorBody>;
  throw new ApiError(res.status, data.error ?? "unknown_error");
}
