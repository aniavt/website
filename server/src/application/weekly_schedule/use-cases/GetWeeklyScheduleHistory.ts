import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleHistoryEntryDto } from "../dto";
import { toWeeklyScheduleHistoryEntryDto } from "../dto";
import { assertPermission } from "@application/shared/auth";


export class GetWeeklyScheduleHistoryUseCase {
    constructor(
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requester: UserEntity | string,
        scheduleId: string,
    ): Promise<Result<WeeklyScheduleHistoryEntryDto[], WeeklyScheduleError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "weekly_schedule", permission: WeeklySchedulePermission.READ_WEEKLY_SCHEDULE_HISTORY },
            "weekly_schedule_not_authorized",
        );
        if (auth.isError()) return auth;

        const schedule = await this.weeklyScheduleRepository.findById(scheduleId, { includeDeleted: true });
        if (!schedule) return err("weekly_schedule_not_found");

        const entries = await this.weeklyScheduleHistoryRepository.findByScheduleId(scheduleId);
        const userIds = [...new Set(entries.map((e) => e.by))];
        const users = await this.userRepository.findByIds(userIds);
        const usernameMap = new Map(userIds.map((id) => [id, users.get(id)?.username ?? id]));

        return ok(entries.map((e) => toWeeklyScheduleHistoryEntryDto(e, usernameMap.get(e.by) ?? e.by)));
    }
}
