import type { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import type { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import type {
    WeeklyScheduleTagDto,
    WeeklyScheduleDto,
    WeeklyScheduleHistoryEntryDto,
} from "@ania/api-contract/weekly-schedule";

export type {
    WeeklyScheduleTagDto,
    WeeklyScheduleDto,
    WeeklyScheduleHistoryEntryDto,
    CreateWeeklyScheduleInput,
    UpdateWeeklyScheduleInput,
} from "@ania/api-contract/weekly-schedule";

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
        timestamp: entry.timestamp.toISOString(),
    };
}
