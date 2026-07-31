import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";
import { resolveRequester } from "@application/shared/auth";


export class GetWeeklyScheduleByIdUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requester: UserEntity | string | null,
        id: string,
    ): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const user = await resolveRequester(this.userRepository, requester);
        const canSeeDeleted =
            user?.hasPermission({
                type: "weekly_schedule",
                permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE,
            }) === true;

        const schedule = await this.weeklyScheduleRepository.findById(id, {
            includeDeleted: canSeeDeleted,
        });
        if (!schedule) return err("weekly_schedule_not_found");
        const file = await this.fileRepository.findById(schedule.fileId);
        const contentType = file?.contentType ?? null;
        return ok(toWeeklyScheduleDto(schedule, contentType));
    }
}
