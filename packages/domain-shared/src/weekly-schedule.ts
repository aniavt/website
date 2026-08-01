export const WEEKLY_SCHEDULE_HISTORY_ACTIONS = [
  "created",
  "updated",
  "deleted",
  "restored",
] as const;
export type WeeklyScheduleHistoryAction =
  (typeof WEEKLY_SCHEDULE_HISTORY_ACTIONS)[number];
