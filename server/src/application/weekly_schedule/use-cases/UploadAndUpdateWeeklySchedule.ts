import type { UploadFileUseCase, UploadFileInput } from "@application/media/use-cases/UploadFile";
import type { DeleteFileUseCase } from "@application/media/use-cases/DeleteFile";
import type { MediaError } from "@application/media/errors";
import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import { type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import type { UpdateWeeklyScheduleUseCase } from "./UpdateWeeklySchedule";

export type UploadAndUpdateWeeklyScheduleError = MediaError | WeeklyScheduleError;

export interface UploadAndUpdateWeeklyScheduleInput {
    readonly id: string;
    readonly file: Omit<UploadFileInput, "isPrivate">;
}

export class UploadAndUpdateWeeklyScheduleUseCase {
    constructor(
        private readonly uploadFile: UploadFileUseCase,
        private readonly deleteFile: DeleteFileUseCase,
        private readonly updateWeeklySchedule: UpdateWeeklyScheduleUseCase,
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
    ) {}

    async execute(
        requesterId: string,
        input: UploadAndUpdateWeeklyScheduleInput,
    ): Promise<Result<WeeklyScheduleDto, UploadAndUpdateWeeklyScheduleError>> {
        const existing = await this.weeklyScheduleRepository.findById(input.id);
        const oldFileId = existing?.fileId;

        const uploadResult = await this.uploadFile.execute({
            ...input.file,
            isPrivate: false,
        });
        if (uploadResult.isError()) {
            return uploadResult;
        }

        const fileId = uploadResult.data.id;
        const updateResult = await this.updateWeeklySchedule.execute(requesterId, {
            id: input.id,
            fileId,
        });

        if (updateResult.isError()) {
            const compensate = await this.deleteFile.execute(fileId);
            if (compensate.isError()) {
                console.error(
                    `Failed to compensate uploaded file ${fileId} after weekly schedule update failure:`,
                    compensate.error,
                );
            }
            return updateResult;
        }

        if (oldFileId !== undefined && oldFileId !== fileId) {
            const cleanup = await this.deleteFile.execute(oldFileId);
            if (cleanup.isError()) {
                console.error(
                    `Failed to delete previous file ${oldFileId} after weekly schedule update:`,
                    cleanup.error,
                );
            }
        }

        return updateResult;
    }
}
