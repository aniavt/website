import type { UserEntity } from "@domain/entities/User";
import type { MediaService } from "@domain/services/MediaService";
import type { UploadParams } from "@domain/services/ObjectStorage";
import { mediaErrorFromUnknown, type MediaError } from "@application/media/errors";
import { err, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import type { CreateWeeklyScheduleUseCase } from "./CreateWeeklySchedule";

export type UploadAndCreateWeeklyScheduleError = MediaError | WeeklyScheduleError;

export interface UploadAndCreateWeeklyScheduleInput {
    readonly week: number;
    readonly year: number;
    readonly file: Omit<UploadParams, "isPrivate">;
}

export class UploadAndCreateWeeklyScheduleUseCase {
    constructor(
        private readonly mediaService: MediaService,
        private readonly createWeeklySchedule: CreateWeeklyScheduleUseCase,
    ) {}

    async execute(
        requester: UserEntity | string,
        input: UploadAndCreateWeeklyScheduleInput,
    ): Promise<Result<WeeklyScheduleDto, UploadAndCreateWeeklyScheduleError>> {
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

        const scheduleResult = await this.createWeeklySchedule.execute(requester, {
            week: input.week,
            year: input.year,
            fileId,
        });

        if (scheduleResult.isError()) {
            try {
                await this.mediaService.delete(fileId);
            } catch (compensateError) {
                console.error(
                    `Failed to compensate uploaded file ${fileId} after weekly schedule create failure:`,
                    mediaErrorFromUnknown(compensateError, "media_delete_failed"),
                );
            }
            return scheduleResult;
        }

        return scheduleResult;
    }
}
