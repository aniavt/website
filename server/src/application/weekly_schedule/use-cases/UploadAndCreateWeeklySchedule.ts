import type { UserEntity } from "@domain/entities/User";
import type { UploadFileUseCase, UploadFileInput } from "@application/media/use-cases/UploadFile";
import type { DeleteFileUseCase } from "@application/media/use-cases/DeleteFile";
import type { MediaError } from "@application/media/errors";
import { type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import type { CreateWeeklyScheduleUseCase } from "./CreateWeeklySchedule";

export type UploadAndCreateWeeklyScheduleError = MediaError | WeeklyScheduleError;

export interface UploadAndCreateWeeklyScheduleInput {
    readonly week: number;
    readonly year: number;
    readonly file: Omit<UploadFileInput, "isPrivate">;
}

export class UploadAndCreateWeeklyScheduleUseCase {
    constructor(
        private readonly uploadFile: UploadFileUseCase,
        private readonly deleteFile: DeleteFileUseCase,
        private readonly createWeeklySchedule: CreateWeeklyScheduleUseCase,
    ) {}

    async execute(
        requester: UserEntity | string,
        input: UploadAndCreateWeeklyScheduleInput,
    ): Promise<Result<WeeklyScheduleDto, UploadAndCreateWeeklyScheduleError>> {
        const uploadResult = await this.uploadFile.execute({
            ...input.file,
            isPrivate: false,
        });
        if (uploadResult.isError()) {
            return uploadResult;
        }

        const fileId = uploadResult.data.id;
        const scheduleResult = await this.createWeeklySchedule.execute(requester, {
            week: input.week,
            year: input.year,
            fileId,
        });

        if (scheduleResult.isError()) {
            const compensate = await this.deleteFile.execute(fileId);
            if (compensate.isError()) {
                console.error(
                    `Failed to compensate uploaded file ${fileId} after weekly schedule create failure:`,
                    compensate.error,
                );
            }
            return scheduleResult;
        }

        return scheduleResult;
    }
}
