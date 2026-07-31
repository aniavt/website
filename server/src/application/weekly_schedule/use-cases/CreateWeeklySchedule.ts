import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import { WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto, CreateWeeklyScheduleInput } from "../dto";
import { toWeeklyScheduleDto } from "../dto";
import { assertPermission } from "@application/shared/auth";

export type { CreateWeeklyScheduleInput };

export class CreateWeeklyScheduleUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly transactionManager: TransactionManager,
    ) {}

    async execute(requester: UserEntity | string, input: CreateWeeklyScheduleInput): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "weekly_schedule", permission: WeeklySchedulePermission.CREATE_WEEKLY_SCHEDULE },
            "weekly_schedule_not_authorized",
        );
        if (auth.isError()) return auth;

        const schedule = new WeeklySchedule({
            id: "",
            week: input.week,
            year: input.year,
            fileId: input.fileId,
            isDeleted: false,
            title: input.title ?? "",
            description: input.description ?? "",
            tags: input.tags ?? [],
        });
        if (!schedule.isWeekValid()) return err("weekly_schedule_invalid_week");

        const file = await this.fileRepository.findById(input.fileId);
        if (!file) return err("weekly_schedule_file_not_found");
        if (file.isPrivate) return err("weekly_schedule_file_not_found");

        const existing = await this.weeklyScheduleRepository.findByWeekAndYear(input.week, input.year);
        if (existing) return err("weekly_schedule_duplicate_week_year");

        const id = this.idGenerator.generateUUID();
        const toSave = new WeeklySchedule({
            id,
            week: input.week,
            year: input.year,
            fileId: input.fileId,
            isDeleted: false,
            title: input.title ?? "",
            description: input.description ?? "",
            tags: input.tags ?? [],
        });

        try {
            await this.transactionManager.runInTransaction(async () => {
                await this.weeklyScheduleRepository.save(toSave);
                await this.weeklyScheduleHistoryRepository.append(
                    new WeeklyScheduleHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        scheduleId: toSave.id,
                        week: toSave.week,
                        year: toSave.year,
                        fileId: toSave.fileId,
                        action: "created",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                );
            });
        } catch (error) {
            console.error("weekly_schedule_save_failed", error);
            return err("weekly_schedule_save_failed");
        }

        return ok(toWeeklyScheduleDto(toSave));
    }
}
