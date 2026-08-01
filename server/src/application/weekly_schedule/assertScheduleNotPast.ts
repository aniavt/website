import { getISOWeekAndYear } from "@ania/date";
import type { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "./errors";

export function assertScheduleNotPast(
  schedule: Pick<WeeklySchedule, "week" | "year">,
  now: Date = new Date(),
): Result<void, WeeklyScheduleError> {
  const { week: currentWeek, year: currentYear } = getISOWeekAndYear(now);
  const isPast =
    schedule.year < currentYear ||
    (schedule.year === currentYear && schedule.week < currentWeek);
  if (isPast) return err("weekly_schedule_cannot_modify_past");
  return ok(undefined);
}
