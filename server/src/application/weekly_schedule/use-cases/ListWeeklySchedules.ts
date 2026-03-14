import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";


export interface ListWeeklySchedulesOptions {
    year?: number;
    includeDeleted?: boolean;
}

export class ListWeeklySchedulesUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string | null, options?: ListWeeklySchedulesOptions): Promise<Result<WeeklyScheduleDto[], WeeklyScheduleError>> {
        const canSeeDeleted =
            requesterId !== null &&
            (await this.userRepository.findById(requesterId))?.hasPermission({
                type: "weekly_schedule",
                permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE,
            }) === true;

        const effectiveIncludeDeleted = canSeeDeleted && options?.includeDeleted === true;
        const schedules = await this.weeklyScheduleRepository.findAll({
            ...options,
            includeDeleted: effectiveIncludeDeleted,
        });
        const withTypes = await Promise.all(
            schedules.map(async (schedule) => {
                const file = await this.fileRepository.findById(schedule.fileId);
                const contentType = file?.contentType ?? null;
                return toWeeklyScheduleDto(schedule, contentType);
            }),
        );
        return ok(withTypes);
    }
}
