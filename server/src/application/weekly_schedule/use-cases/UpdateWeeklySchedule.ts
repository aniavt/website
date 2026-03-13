import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";


export interface UpdateWeeklyScheduleInput {
    id: string;
    fileId?: string;
}

export class UpdateWeeklyScheduleUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute(requesterId: string, input: UpdateWeeklyScheduleInput): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("weekly_schedule_not_authorized");
        if (!requester.hasPermission({ type: "weekly_schedule", permission: WeeklySchedulePermission.UPDATE_WEEKLY_SCHEDULE })) {
            return err("weekly_schedule_not_authorized");
        }

        const schedule = await this.weeklyScheduleRepository.findById(input.id);
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

        let fileId = schedule.fileId;
        if (input.fileId !== undefined) {
            const file = await this.fileRepository.findById(input.fileId);
            if (!file) return err("weekly_schedule_file_not_found");
            if (file.isPrivate) return err("weekly_schedule_file_not_found");
            fileId = input.fileId;
        }

        const updated = new WeeklySchedule({
            id: schedule.id,
            week: schedule.week,
            year: schedule.year,
            fileId,
            isDeleted: schedule.isDeleted,
        });

        try {
            await this.weeklyScheduleRepository.save(updated);
            const historyId = this.idGenerator.generateUUID();
            await this.weeklyScheduleHistoryRepository.append(
                new WeeklyScheduleHistoryEntry({
                    id: historyId,
                    scheduleId: updated.id,
                    week: updated.week,
                    year: updated.year,
                    fileId: updated.fileId,
                    action: "updated",
                    by: requesterId,
                    timestamp: new Date(),
                }),
            );
        } catch {
            return err("weekly_schedule_save_failed");
        }

        return ok(toWeeklyScheduleDto(updated));
    }
}
