import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";
import { assertPermission } from "@application/shared/auth";
import { saveWithHistory } from "@application/shared/saveWithHistory";
import { assertScheduleNotPast } from "../assertScheduleNotPast";

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

        const notPast = assertScheduleNotPast(schedule);
        if (notPast.isError()) return notPast;

        if (!schedule.isDeleted) {
            return ok(toWeeklyScheduleDto(schedule));
        }

        schedule.restore();

        const saved = await saveWithHistory({
            tx: this.transactionManager,
            persist: () => this.weeklyScheduleRepository.save(schedule),
            append: () =>
                this.weeklyScheduleHistoryRepository.append(
                    new WeeklyScheduleHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        scheduleId: schedule.id,
                        week: schedule.week,
                        year: schedule.year,
                        fileId: schedule.fileId,
                        action: "restored",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                ),
            saveFailed: "weekly_schedule_save_failed",
        });
        if (saved.isError()) return saved;

        return ok(toWeeklyScheduleDto(schedule));
    }
}
