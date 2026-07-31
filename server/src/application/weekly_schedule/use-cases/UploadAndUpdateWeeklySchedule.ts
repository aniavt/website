import type { UserEntity } from "@domain/entities/User";
import type { MediaService } from "@domain/services/MediaService";
import type { UploadParams } from "@domain/services/ObjectStorage";
import { mediaErrorFromUnknown, type MediaError } from "@application/media/errors";
import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import { err, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import type { UpdateWeeklyScheduleUseCase } from "./UpdateWeeklySchedule";

export type UploadAndUpdateWeeklyScheduleError = MediaError | WeeklyScheduleError;

export interface UploadAndUpdateWeeklyScheduleInput {
    readonly id: string;
    readonly file: Omit<UploadParams, "isPrivate">;
}

export class UploadAndUpdateWeeklyScheduleUseCase {
    constructor(
        private readonly mediaService: MediaService,
        private readonly updateWeeklySchedule: UpdateWeeklyScheduleUseCase,
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
    ) {}

    async execute(
        requester: UserEntity | string,
        input: UploadAndUpdateWeeklyScheduleInput,
    ): Promise<Result<WeeklyScheduleDto, UploadAndUpdateWeeklyScheduleError>> {
        const existing = await this.weeklyScheduleRepository.findById(input.id);
        const oldFileId = existing?.fileId;

        let fileId: string;
        try {
            const file = await this.mediaService.upload({
                ...input.file,
                isPrivate: false,
            });
            fileId = file.id;
        } catch (error) {
            return err(mediaErrorFromUnknown(error, "media_upload_failed"));
        }

        const updateResult = await this.updateWeeklySchedule.execute(requester, {
            id: input.id,
            fileId,
        });

        if (updateResult.isError()) {
            try {
                await this.mediaService.delete(fileId);
            } catch (compensateError) {
                console.error(
                    `Failed to compensate uploaded file ${fileId} after weekly schedule update failure:`,
                    mediaErrorFromUnknown(compensateError, "media_delete_failed"),
                );
            }
            return updateResult;
        }

        if (oldFileId !== undefined && oldFileId !== fileId) {
            try {
                await this.mediaService.delete(oldFileId);
            } catch (cleanupError) {
                console.error(
                    `Failed to delete previous file ${oldFileId} after weekly schedule update:`,
                    mediaErrorFromUnknown(cleanupError, "media_delete_failed"),
                );
            }
        }

        return updateResult;
    }
}
