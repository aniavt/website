import { getISOWeekAndYear } from "@ania/date";
import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto, UpdateWeeklyScheduleInput as UpdateWeeklyScheduleBody } from "../dto";
import { toWeeklyScheduleDto } from "../dto";
import { assertPermission } from "@application/shared/auth";

export type UpdateWeeklyScheduleInput = UpdateWeeklyScheduleBody & { id: string };

export class UpdateWeeklyScheduleUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly transactionManager: TransactionManager,
    ) {}

    async execute(requester: UserEntity | string, input: UpdateWeeklyScheduleInput): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "weekly_schedule", permission: WeeklySchedulePermission.UPDATE_WEEKLY_SCHEDULE },
            "weekly_schedule_not_authorized",
        );
        if (auth.isError()) return auth;

        const schedule = await this.weeklyScheduleRepository.findById(input.id);
        if (!schedule) return err("weekly_schedule_not_found");

        const now = new Date();
        const { week: currentWeek, year: currentYear } = getISOWeekAndYear(now);
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

        schedule.applyUpdate({
            fileId: input.fileId !== undefined ? fileId : undefined,
            title: input.title,
            description: input.description,
            tags: input.tags,
        });

        try {
            await this.transactionManager.runInTransaction(async () => {
                await this.weeklyScheduleRepository.save(schedule);
                await this.weeklyScheduleHistoryRepository.append(
                    new WeeklyScheduleHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        scheduleId: schedule.id,
                        week: schedule.week,
                        year: schedule.year,
                        fileId: schedule.fileId,
                        action: "updated",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                );
            });
        } catch (error) {
            console.error("weekly_schedule_save_failed", error);
            return err("weekly_schedule_save_failed");
        }

        return ok(toWeeklyScheduleDto(schedule));
    }
}
