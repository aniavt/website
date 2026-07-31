import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { getISOWeekAndYear } from "@ania/date";
import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";
import { assertPermission } from "@application/shared/auth";


export class RestoreWeeklyScheduleUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly transactionManager: TransactionManager,
    ) {}

    async execute(requester: UserEntity | string, id: string): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "weekly_schedule", permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE },
            "weekly_schedule_not_authorized",
        );
        if (auth.isError()) return auth;

        const schedule = await this.weeklyScheduleRepository.findById(id, { includeDeleted: true });
        if (!schedule) return err("weekly_schedule_not_found");

        const now = new Date();
        const { week: currentWeek, year: currentYear } = getISOWeekAndYear(now);
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
            await this.transactionManager.runInTransaction(async () => {
                await this.weeklyScheduleRepository.save(restored);
                await this.weeklyScheduleHistoryRepository.append(
                    new WeeklyScheduleHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        scheduleId: restored.id,
                        week: restored.week,
                        year: restored.year,
                        fileId: restored.fileId,
                        action: "restored",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                );
            });
        } catch (error) {
            console.error("weekly_schedule_save_failed", error);
            return err("weekly_schedule_save_failed");
        }

        return ok(toWeeklyScheduleDto(restored));
    }
}

