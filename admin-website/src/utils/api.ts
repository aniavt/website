import { apiUrl } from "@config";

class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${apiUrl}${path}`, opts);

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, data.error ?? "unknown_error");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export { ApiError };

export interface WeeklyScheduleTagDto {
  readonly label: string;
  readonly bgColor: string;
  readonly txColor: string;
}

export interface WeeklyScheduleDto {
  readonly id: string;
  readonly week: number;
  readonly year: number;
  readonly fileId: string;
  readonly isDeleted: boolean;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly WeeklyScheduleTagDto[];
  readonly fileContentType?: string | null;
}

export interface WeeklyScheduleHistoryEntryDto {
  readonly id: string;
  readonly scheduleId: string;
  readonly week: number;
  readonly year: number;
  readonly fileId: string;
  readonly action: string;
  readonly by: string;
  readonly byUsername: string;
  readonly timestamp: string;
}

export async function listWeeklySchedules(
  year?: number,
  includeDeleted: boolean = false,
): Promise<WeeklyScheduleDto[]> {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (includeDeleted) params.set("includeDeleted", "true");
  const query = params.toString();
  return api.get<WeeklyScheduleDto[]>(`/weekly-schedule${query ? `?${query}` : ""}`);
}

export async function getWeeklyScheduleById(id: string): Promise<WeeklyScheduleDto> {
  return api.get<WeeklyScheduleDto>(`/weekly-schedule/${id}`);
}

export async function getWeeklyScheduleHistory(
  id: string,
): Promise<WeeklyScheduleHistoryEntryDto[]> {
  return api.get<WeeklyScheduleHistoryEntryDto[]>(`/weekly-schedule/${id}/history`);
}

export async function deleteWeeklySchedule(id: string): Promise<void> {
  await api.delete<undefined>(`/weekly-schedule/${id}`);
}

export async function restoreWeeklySchedule(id: string): Promise<WeeklyScheduleDto> {
  return api.post<WeeklyScheduleDto>(`/weekly-schedule/${id}/restore`);
}

export interface UpdateWeeklyScheduleInput {
  title?: string;
  description?: string;
  tags?: { label: string; bgColor: string; txColor: string }[];
}

export async function updateWeeklySchedule(
  id: string,
  input: UpdateWeeklyScheduleInput,
): Promise<WeeklyScheduleDto> {
  return api.patch<WeeklyScheduleDto>(`/weekly-schedule/${id}`, input);
}

interface UploadWeeklyScheduleInput {
  week: number;
  year: number;
  file: File;
}

export async function uploadWeeklyScheduleFile(
  input: UploadWeeklyScheduleInput,
): Promise<WeeklyScheduleDto> {
  const formData = new FormData();
  formData.set("week", String(input.week));
  formData.set("year", String(input.year));
  formData.set("file", input.file);

  const res = await fetch(`${apiUrl}/weekly-schedule/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, data.error ?? "unknown_error");
  }

  return res.json();
}

export async function updateWeeklyScheduleFile(
  id: string,
  file: File,
): Promise<WeeklyScheduleDto> {
  const formData = new FormData();
  formData.set("file", file);

  const res = await fetch(`${apiUrl}/weekly-schedule/${id}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, data.error ?? "unknown_error");
  }

  return res.json();
}
