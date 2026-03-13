import type { WeeklySchedule } from "@domain/entities/WeeklySchedule";

export interface WeeklyScheduleFindAllOptions {
    readonly year?: number;
    readonly includeDeleted?: boolean;
}

export interface WeeklyScheduleRepository {
    save(schedule: WeeklySchedule): Promise<void>;
    findById(id: string): Promise<WeeklySchedule | null>;
    findByWeekAndYear(week: number, year: number): Promise<WeeklySchedule | null>;
    findAll(options?: WeeklyScheduleFindAllOptions): Promise<WeeklySchedule[]>;
    delete(id: string): Promise<void>;
}
