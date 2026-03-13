export type WeeklyScheduleError =
    | "weekly_schedule_not_found"
    | "weekly_schedule_not_authorized"
    | "weekly_schedule_save_failed"
    | "weekly_schedule_invalid_week"
    | "weekly_schedule_duplicate_week_year"
    | "weekly_schedule_file_not_found"
    | "weekly_schedule_cannot_modify_past";
