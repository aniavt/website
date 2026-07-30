import type { WeeklyScheduleDto } from "@ania/api-contract/weekly-schedule";
import type { FaqItemPublicDto } from "@ania/api-contract/faq";
import { buildApiUrl } from "./buildApiUrl";

export async function getCurrentWeeklySchedule(): Promise<WeeklyScheduleDto | null> {
  const res = await fetch(buildApiUrl("/weekly-schedule/current"));

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("weekly_schedule_load_failed");
  }

  const data = await res.json();
  return data;
}

export async function getFaqs(): Promise<FaqItemPublicDto[]> {
  const res = await fetch(buildApiUrl("/faq?activeOnly=true"));

  if (!res.ok) {
    throw new Error("faq_load_failed");
  }

  const data = await res.json();
  return data as FaqItemPublicDto[];
}
