import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";


export class RestoreWeeklyScheduleUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute(requesterId: string, id: string): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("weekly_schedule_not_authorized");
        if (!requester.hasPermission({ type: "weekly_schedule", permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE })) {
            return err("weekly_schedule_not_authorized");
        }

        const schedule = await this.weeklyScheduleRepository.findById(id);
        if (!schedule) return err("weekly_schedule_not_found");

        const now = new Date();
        const currentWeek = WeeklySchedule.getWeekNumber(now);
        const currentYear = now.getFullYear();
        const isPast =
            schedule.year < currentYear ||
            (schedule.year === currentYear && schedule.week < currentWeek);
        if (isPast) {
            return err("weekly_schedule_cannot_modify_past");
        }

        if (!schedule.isDeleted) {
            return ok(toWeeklyScheduleDto(schedule));
        }

        const restored = new WeeklySchedule({
            id: schedule.id,
            week: schedule.week,
            year: schedule.year,
            fileId: schedule.fileId,
            isDeleted: false,
            title: schedule.title,
            description: schedule.description,
            tags: schedule.tags,
        });

        try {
            await this.weeklyScheduleRepository.save(restored);
            const historyId = this.idGenerator.generateUUID();
            await this.weeklyScheduleHistoryRepository.append(
                new WeeklyScheduleHistoryEntry({
                    id: historyId,
                    scheduleId: restored.id,
                    week: restored.week,
                    year: restored.year,
                    fileId: restored.fileId,
                    action: "restored",
                    by: requesterId,
                    timestamp: new Date(),
                }),
            );
        } catch {
            return err("weekly_schedule_save_failed");
        }

        return ok(toWeeklyScheduleDto(restored));
    }
}

