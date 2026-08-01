import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";
import { resolveRequester } from "@application/shared/auth";


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

    async execute(
        requester: UserEntity | string | null,
        options?: ListWeeklySchedulesOptions,
    ): Promise<Result<WeeklyScheduleDto[], WeeklyScheduleError>> {
        const user = await resolveRequester(this.userRepository, requester);
        const canSeeDeleted =
            user?.hasPermission({
                type: "weekly_schedule",
                permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE,
            }) === true;

        const effectiveIncludeDeleted = canSeeDeleted && options?.includeDeleted === true;
        const schedules = await this.weeklyScheduleRepository.findAll({
            ...options,
            includeDeleted: effectiveIncludeDeleted,
        });
        const files = await this.fileRepository.findByIds(schedules.map((s) => s.fileId));
        return ok(
            schedules.map((schedule) =>
                toWeeklyScheduleDto(schedule, files.get(schedule.fileId)?.contentType ?? null),
            ),
        );
    }
}
