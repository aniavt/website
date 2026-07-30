import type { WeeklyScheduleHistoryAction } from "@ania/domain-shared/weekly-schedule";

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
  readonly action: WeeklyScheduleHistoryAction;
  readonly by: string;
  readonly byUsername: string;
  readonly timestamp: string;
}

export interface CreateWeeklyScheduleInput {
  week: number;
  year: number;
  fileId: string;
  title?: string;
  description?: string;
  tags?: readonly WeeklyScheduleTagDto[];
}

/** HTTP body for PATCH (id comes from the route). */
export interface UpdateWeeklyScheduleInput {
  fileId?: string;
  title?: string;
  description?: string;
  tags?: readonly WeeklyScheduleTagDto[];
}
