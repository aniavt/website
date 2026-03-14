import type { WeeklySchedule } from "@domain/entities/WeeklySchedule";

export interface WeeklyScheduleFindAllOptions {
    readonly year?: number;
    readonly includeDeleted?: boolean;
}

export interface FindByIdOptions {
    readonly includeDeleted?: boolean;
}

export interface FindByWeekAndYearOptions {
    readonly includeDeleted?: boolean;
}

export interface WeeklyScheduleRepository {
    save(schedule: WeeklySchedule): Promise<void>;
    findById(id: string, options?: FindByIdOptions): Promise<WeeklySchedule | null>;
    findByWeekAndYear(week: number, year: number, options?: FindByWeekAndYearOptions): Promise<WeeklySchedule | null>;
    findAll(options?: WeeklyScheduleFindAllOptions): Promise<WeeklySchedule[]>;
    delete(id: string): Promise<void>;
}
