import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import type { WeeklyScheduleRepository } from "@domain/repositories/WeeklyScheduleRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import { err, ok, type Result } from "@lib/result";
import type { WeeklyScheduleError } from "../errors";
import type { WeeklyScheduleDto } from "../dto";
import { toWeeklyScheduleDto } from "../dto";


export class GetCurrentWeekScheduleUseCase {
    constructor(
        private readonly weeklyScheduleRepository: WeeklyScheduleRepository,
        private readonly fileRepository: FileRepository,
    ) {}

    async execute(): Promise<Result<WeeklyScheduleDto, WeeklyScheduleError>> {
        const now = new Date();
        const currentWeek = WeeklySchedule.getWeekNumber(now);
        const currentYear = now.getFullYear();

        const schedule = await this.weeklyScheduleRepository.findByWeekAndYear(currentWeek, currentYear);
        if (!schedule) return err("weekly_schedule_not_found");

        const file = await this.fileRepository.findById(schedule.fileId);
        const contentType = file?.contentType ?? null;

        return ok(toWeeklyScheduleDto(schedule, contentType));
    }
}
