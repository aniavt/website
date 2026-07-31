import type { CreateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/CreateWeeklySchedule";
import type { UpdateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UpdateWeeklySchedule";
import type { DeleteWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/DeleteWeeklySchedule";
import type { GetWeeklyScheduleByIdUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleById";
import type { GetWeeklyScheduleByWeekAndYearUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleByWeekAndYear";
import type { GetCurrentWeekScheduleUseCase } from "@application/weekly_schedule/use-cases/GetCurrentWeekSchedule";
import type { ListWeeklySchedulesUseCase } from "@application/weekly_schedule/use-cases/ListWeeklySchedules";
import type { GetWeeklyScheduleHistoryUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleHistory";
import type { RestoreWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/RestoreWeeklySchedule";
import type { UploadAndCreateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UploadAndCreateWeeklySchedule";
import type { UploadAndUpdateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UploadAndUpdateWeeklySchedule";


export interface IWeeklyScheduleUseCases {
    create: CreateWeeklyScheduleUseCase;
    update: UpdateWeeklyScheduleUseCase;
    delete: DeleteWeeklyScheduleUseCase;
    restore: RestoreWeeklyScheduleUseCase;
    getById: GetWeeklyScheduleByIdUseCase;
    getByWeekAndYear: GetWeeklyScheduleByWeekAndYearUseCase;
    getCurrentWeek: GetCurrentWeekScheduleUseCase;
    list: ListWeeklySchedulesUseCase;
    getHistory: GetWeeklyScheduleHistoryUseCase;
    uploadAndCreate: UploadAndCreateWeeklyScheduleUseCase;
    uploadAndUpdate: UploadAndUpdateWeeklyScheduleUseCase;
}
