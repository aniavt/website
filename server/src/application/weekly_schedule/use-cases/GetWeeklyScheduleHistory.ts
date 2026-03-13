import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleHistoryEntryDto } from "../dto";
import { toWeeklyScheduleHistoryEntryDto } from "../dto";


export class GetWeeklyScheduleHistoryUseCase {
    constructor(
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string, scheduleId: string): Promise<Result<WeeklyScheduleHistoryEntryDto[], WeeklyScheduleError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("weekly_schedule_not_authorized");
        if (!requester.hasPermission({ type: "weekly_schedule", permission: WeeklySchedulePermission.READ_WEEKLY_SCHEDULE_HISTORY })) {
            return err("weekly_schedule_not_authorized");
        }

        const schedule = await this.weeklyScheduleRepository.findById(scheduleId);
        if (!schedule) return err("weekly_schedule_not_found");

        const entries = await this.weeklyScheduleHistoryRepository.findByScheduleId(scheduleId);
        const userIds = [...new Set(entries.map((e) => e.by))];
        const users = await Promise.all(userIds.map((id) => this.userRepository.findById(id)));
        const usernameMap = new Map(userIds.map((id, i) => [id, users[i]?.username ?? id]));

        return ok(entries.map((e) => toWeeklyScheduleHistoryEntryDto(e, usernameMap.get(e.by) ?? e.by)));
    }
}
