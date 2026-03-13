import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import { ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";


export interface ListWeeklySchedulesOptions {
    year?: number;
    includeDeleted?: boolean;
}

export class ListWeeklySchedulesUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly fileRepository: FileRepository,
    ) {}

    async execute(options?: ListWeeklySchedulesOptions): Promise<Result<WeeklyScheduleDto[], WeeklyScheduleError>> {
        const schedules = await this.weeklyScheduleRepository.findAll(options);
        const withTypes = await Promise.all(
            schedules.map(async (schedule) => {
                const file = await this.fileRepository.findById(schedule.fileId);
                const contentType = file?.contentType ?? null;
                return toWeeklyScheduleDto(schedule, contentType);
            }),
        );
        return ok(withTypes);
    }
}
