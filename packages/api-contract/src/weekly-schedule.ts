import { z } from "zod";
import type { WeeklyScheduleHistoryAction } from "@ania/domain-shared/weekly-schedule";
import { hexColor, nonEmptyMax } from "./zod-helpers";

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

export const WeeklyScheduleTagSchema = z
  .object({
    label: nonEmptyMax(50),
    bgColor: hexColor,
    txColor: hexColor,
  })
  .strict();

export const CreateWeeklyScheduleInputSchema = z
  .object({
    week: z.number().int().min(1).max(53),
    year: z.number().int().min(2000).max(2100),
    fileId: nonEmptyMax(255),
    title: nonEmptyMax(200).optional(),
    description: z.string().max(2000).optional(),
    tags: z.array(WeeklyScheduleTagSchema).optional(),
  })
  .strict();

export type CreateWeeklyScheduleInput = z.infer<typeof CreateWeeklyScheduleInputSchema>;

/** HTTP body for PATCH (id comes from the route). */
export const UpdateWeeklyScheduleInputSchema = z
  .object({
    fileId: nonEmptyMax(255).optional(),
    title: nonEmptyMax(200).optional(),
    description: z.string().max(2000).optional(),
    tags: z.array(WeeklyScheduleTagSchema).optional(),
  })
  .strict();

export type UpdateWeeklyScheduleInput = z.infer<typeof UpdateWeeklyScheduleInputSchema>;

/** Multipart fields for POST /weekly-schedule/upload (values arrive as strings). */
export const UploadWeeklyScheduleFieldsSchema = z
  .object({
    week: z.coerce.number().int().min(1).max(53),
    year: z.coerce.number().int().min(2000).max(2100),
  })
  .strict();

export type UploadWeeklyScheduleFields = z.infer<typeof UploadWeeklyScheduleFieldsSchema>;
