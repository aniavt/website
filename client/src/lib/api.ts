import type { WeeklyScheduleDto } from "@ania/api-contract/weekly-schedule";
import type { FaqItemPublicDto } from "@ania/api-contract/faq";
import { throwApiError } from "@ania/api-contract/error";
import { buildApiUrl } from "./buildApiUrl";

export async function getCurrentWeeklySchedule(): Promise<WeeklyScheduleDto | null> {
  const res = await fetch(buildApiUrl("/weekly-schedule/current"));

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) await throwApiError(res);

  const data = await res.json();
  return data;
}

export async function getFaqs(): Promise<FaqItemPublicDto[]> {
  const res = await fetch(buildApiUrl("/faq?activeOnly=true"));

  if (!res.ok) await throwApiError(res);

  const data = await res.json();
  return data as FaqItemPublicDto[];
}
