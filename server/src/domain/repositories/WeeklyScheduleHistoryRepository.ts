import type { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";


export interface WeeklyScheduleHistoryRepository {
    append(entry: WeeklyScheduleHistoryEntry): Promise<void>;
    findByScheduleId(scheduleId: string): Promise<WeeklyScheduleHistoryEntry[]>;
    findByWeekAndYear(week: number, year: number): Promise<WeeklyScheduleHistoryEntry[]>;
}
