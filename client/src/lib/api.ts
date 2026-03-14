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

export async function getCurrentWeeklySchedule(): Promise<WeeklyScheduleDto | null> {
  let url: string;

  if (typeof window === "undefined") {
    // SSR: use process.env (set at container runtime); import.meta.env is build-time only
    const g = typeof globalThis !== "undefined" ? (globalThis as { process?: { env?: Record<string, string> } }) : null;
    const envUrl = g?.process?.env?.PUBLIC_SERVER_URL;
    const base = envUrl || import.meta.env.PUBLIC_SERVER_URL || "";
    url = `${base.replace(/\/+$/, "")}${g === null ? "/api" : ""}/weekly-schedule/current`;
  } else {
    url = "/api/weekly-schedule/current";
  }

  const res = await fetch(url);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("weekly_schedule_load_failed");
  }

  const data = await res.json();
  return data;
}

