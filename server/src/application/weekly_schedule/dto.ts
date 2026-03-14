import type { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import type { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";

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
    readonly timestamp: Date;
}

export function toWeeklyScheduleDto(schedule: WeeklySchedule, fileContentType?: string | null): WeeklyScheduleDto {
    return {
        id: schedule.id,
        week: schedule.week,
        year: schedule.year,
        fileId: schedule.fileId,
        isDeleted: schedule.isDeleted,
        title: schedule.title,
        description: schedule.description,
        tags: schedule.tags as WeeklyScheduleTagDto[],
        fileContentType,
    };
}

export function toWeeklyScheduleHistoryEntryDto(
    entry: WeeklyScheduleHistoryEntry,
    byUsername: string,
): WeeklyScheduleHistoryEntryDto {
    return {
        id: entry.id,
        scheduleId: entry.scheduleId,
        week: entry.week,
        year: entry.year,
        fileId: entry.fileId,
        action: entry.action,
        by: entry.by,
        byUsername,
        timestamp: entry.timestamp,
    };
}
