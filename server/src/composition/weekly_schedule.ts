import type { IWeeklyScheduleUseCases } from "@application/weekly_schedule/IWeeklyScheduleUseCases";
import { CreateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/CreateWeeklySchedule";
import { UpdateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UpdateWeeklySchedule";
import { DeleteWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/DeleteWeeklySchedule";
import { GetWeeklyScheduleByIdUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleById";
import { GetWeeklyScheduleByWeekAndYearUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleByWeekAndYear";
import { GetCurrentWeekScheduleUseCase } from "@application/weekly_schedule/use-cases/GetCurrentWeekSchedule";
import { ListWeeklySchedulesUseCase } from "@application/weekly_schedule/use-cases/ListWeeklySchedules";
import { GetWeeklyScheduleHistoryUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleHistory";
import { RestoreWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/RestoreWeeklySchedule";
import { UploadAndCreateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UploadAndCreateWeeklySchedule";
import { UploadAndUpdateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UploadAndUpdateWeeklySchedule";
import { MongoDbWeeklyScheduleRepository } from "@infrastructure/WeeklyScheduleRepository/MongoDb";
import { MongoDbWeeklyScheduleHistoryRepository } from "@infrastructure/WeeklyScheduleHistoryRepository/MongoDb";

import { mongoClient, idGenerator, transactionManager } from "./infra";
import { userRepository } from "./users";
import { fileRepository, mediaService } from "./media";

const weeklyScheduleRepository = new MongoDbWeeklyScheduleRepository(mongoClient);
const weeklyScheduleHistoryRepository = new MongoDbWeeklyScheduleHistoryRepository(mongoClient);

const createWeeklySchedule = new CreateWeeklyScheduleUseCase(
    weeklyScheduleRepository,
    weeklyScheduleHistoryRepository,
    fileRepository,
    userRepository,
    idGenerator,
    transactionManager,
);
const updateWeeklySchedule = new UpdateWeeklyScheduleUseCase(
    weeklyScheduleRepository,
    weeklyScheduleHistoryRepository,
    fileRepository,
    userRepository,
    idGenerator,
    transactionManager,
);

export const weeklyScheduleUseCases: IWeeklyScheduleUseCases = {
    create: createWeeklySchedule,
    update: updateWeeklySchedule,
    delete: new DeleteWeeklyScheduleUseCase(
        weeklyScheduleRepository,
        weeklyScheduleHistoryRepository,
        userRepository,
        idGenerator,
        transactionManager,
    ),
    restore: new RestoreWeeklyScheduleUseCase(
        weeklyScheduleRepository,
        weeklyScheduleHistoryRepository,
        userRepository,
        idGenerator,
        transactionManager,
    ),
    getById: new GetWeeklyScheduleByIdUseCase(weeklyScheduleRepository, fileRepository, userRepository),
    getByWeekAndYear: new GetWeeklyScheduleByWeekAndYearUseCase(weeklyScheduleRepository, fileRepository, userRepository),
    getCurrentWeek: new GetCurrentWeekScheduleUseCase(weeklyScheduleRepository, fileRepository, userRepository),
    list: new ListWeeklySchedulesUseCase(weeklyScheduleRepository, fileRepository, userRepository),
    getHistory: new GetWeeklyScheduleHistoryUseCase(
        weeklyScheduleHistoryRepository,
        weeklyScheduleRepository,
        userRepository,
    ),
    uploadAndCreate: new UploadAndCreateWeeklyScheduleUseCase(
        mediaService,
        createWeeklySchedule,
    ),
    uploadAndUpdate: new UploadAndUpdateWeeklyScheduleUseCase(
        mediaService,
        updateWeeklySchedule,
        weeklyScheduleRepository,
    ),
};
