import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";


export class GetWeeklyScheduleByWeekAndYearUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string | null, week: number, year: number): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        if (week < 1 || week > 53) return err("weekly_schedule_invalid_week");

        const canSeeDeleted =
            requesterId !== null &&
            (await this.userRepository.findById(requesterId))?.hasPermission({
                type: "weekly_schedule",
                permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE,
            }) === true;

        const schedule = await this.weeklyScheduleRepository.findByWeekAndYear(week, year, {
            includeDeleted: canSeeDeleted,
        });
        if (!schedule) return err("weekly_schedule_not_found");
        const file = await this.fileRepository.findById(schedule.fileId);
        const contentType = file?.contentType ?? null;
        return ok(toWeeklyScheduleDto(schedule, contentType));
    }
}
