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


export interface CreateWeeklyScheduleInput {
    week: number;
    year: number;
    fileId: string;
    title?: string;
    description?: string;
    tags?: readonly { label: string; bgColor: string; txColor: string }[];
}

export class CreateWeeklyScheduleUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly weeklyScheduleHistoryRepository: WeeklyScheduleHistoryRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute(requesterId: string, input: CreateWeeklyScheduleInput): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("weekly_schedule_not_authorized");
        if (!requester.hasPermission({ type: "weekly_schedule", permission: WeeklySchedulePermission.CREATE_WEEKLY_SCHEDULE })) {
            return err("weekly_schedule_not_authorized");
        }

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
            await this.weeklyScheduleRepository.save(toSave);
            const historyId = this.idGenerator.generateUUID();
            await this.weeklyScheduleHistoryRepository.append(
                new WeeklyScheduleHistoryEntry({
                    id: historyId,
                    scheduleId: toSave.id,
                    week: toSave.week,
                    year: toSave.year,
                    fileId: toSave.fileId,
                    action: "created",
                    by: requesterId,
                    timestamp: new Date(),
                }),
            );
        } catch {
            return err("weekly_schedule_save_failed");
        }

        return ok(toWeeklyScheduleDto(toSave));
    }
}
