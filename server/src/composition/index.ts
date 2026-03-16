// 
import mongoose from "mongoose";


// Services
import { ArgonIdSecureHasher } from "@infrastructure/ArgonIdSecureHasher";
import { CryptoIdGenerator } from "@infrastructure/CryptoIdGenerator";

// Repositories
import { InMemoryUserRepository } from "@infrastructure/UserRepository/InMemory";
import { MongoDbUserRepository } from "@infrastructure/UserRepository/MongoDb";
import { MongoDbFaqTextRepository } from "@infrastructure/FaqTextRepository/MongoDb";
import { MongoDbFaqItemRepository } from "@infrastructure/FaqItemRepository/MongoDb";
import { MongoDbFaqHistoryRepository } from "@infrastructure/FaqHistoryRepository/MongoDb";
import { MongoDbFileRepository } from "@infrastructure/FileRepository/MongoDb";
import { MongoDbWeeklyScheduleRepository } from "@infrastructure/WeeklyScheduleRepository/MongoDb";
import { MongoDbWeeklyScheduleHistoryRepository } from "@infrastructure/WeeklyScheduleHistoryRepository/MongoDb";
import { S3Client } from "@aws-sdk/client-s3";
import { S3Service } from "@infrastructure/S3Service";

// Use Cases
import type { IUserUseCases } from "@application/users/IUserUseCases";
import { ActivateUserUseCase } from "@application/users/use-cases/ActivateUser";
import { CreateUserUseCase } from "@application/users/use-cases/CreateUser";
import { CreateRootUseCase } from "@application/users/use-cases/CreateRoot";
import { DeactivateUserUseCase } from "@application/users/use-cases/DeactivateUser";
import { GetAllUsersUseCase } from "@application/users/use-cases/GetAllUsers";
import { GetUserByIdUseCase } from "@application/users/use-cases/GetUserById";
import { GetUserByUsernameUseCase } from "@application/users/use-cases/GetUserByUsername";
import { IncrementSessionVersionUseCase } from "@application/users/use-cases/IncrementSessionVersion";
import { UpdatePasswordUseCase } from "@application/users/use-cases/UpdatePassword";
import { VerifyPasswordUseCase } from "@application/users/use-cases/VerifyPassword";
import { ManagePermissionUseCase } from "@application/users/use-cases/ManagePermission";
import { GetUserPermissionsUseCase } from "@application/users/use-cases/GetUserPermissions";

import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import { CreateFaqItemUseCase } from "@application/faq/use-cases/CreateFaqItem";
import { UpdateFaqItemUseCase } from "@application/faq/use-cases/UpdateFaqItem";
import { DeleteFaqItemUseCase } from "@application/faq/use-cases/DeleteFaqItem";
import { RestoreFaqItemUseCase } from "@application/faq/use-cases/RestoreFaqItem";
import { ListFaqItemsUseCase } from "@application/faq/use-cases/ListFaqItems";
import { GetFaqItemUseCase } from "@application/faq/use-cases/GetFaqItem";
import { GetFaqHistoryUseCase } from "@application/faq/use-cases/GetFaqHistory";

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

import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import { UploadFileUseCase } from "@application/media/use-cases/UploadFile";
import { DeleteFileUseCase } from "@application/media/use-cases/DeleteFile";
import { GetFileUrlUseCase } from "@application/media/use-cases/GetFileUrl";

// Application external entries
import { createFastifyServer } from "@infrastructure/http/fastify";
import { createCli } from "@infrastructure/cli";


// Mongo Client
const mongoUri = Bun.env.MONGO_URI;
if (mongoUri === undefined) {
    throw new Error("MONGO_URI is not set");
}
const mongoClient = mongoose.createConnection(mongoUri);

// Composition
const passwordHasher = new ArgonIdSecureHasher();
const idGenerator = new CryptoIdGenerator();
// const userRepository = new InMemoryUserRepository();
const userRepository = new MongoDbUserRepository(mongoClient);
const faqTextRepository = new MongoDbFaqTextRepository(mongoClient);
const faqItemRepository = new MongoDbFaqItemRepository(mongoClient);
const faqHistoryRepository = new MongoDbFaqHistoryRepository(mongoClient);
const fileRepository = new MongoDbFileRepository(mongoClient);
const weeklyScheduleRepository = new MongoDbWeeklyScheduleRepository(mongoClient);
const weeklyScheduleHistoryRepository = new MongoDbWeeklyScheduleHistoryRepository(mongoClient);

const s3Region = Bun.env.S3_REGION;
const s3Bucket = Bun.env.S3_BUCKET;
const s3Endpoint = Bun.env.S3_ENDPOINT;
const s3PublicEndpoint = Bun.env.S3_PUBLIC_ENDPOINT ?? s3Endpoint;
const s3AccessKeyId = Bun.env.AWS_ACCESS_KEY_ID;
const s3SecretAccessKey = Bun.env.AWS_SECRET_ACCESS_KEY;

if (!s3Region || !s3Bucket || !s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error("S3_REGION, S3_BUCKET, S3_ENDPOINT, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set");
}
const s3Client = new S3Client({
    region: s3Region,
    endpoint: s3Endpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
    }
});
const s3SigningClient = new S3Client({
    region: s3Region,
    endpoint: s3PublicEndpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
    }
});
const mediaService = new S3Service(s3Client, s3SigningClient, s3Bucket, idGenerator);

export const userUseCases: IUserUseCases = {
    create: new CreateUserUseCase(userRepository, passwordHasher, idGenerator),
    createRoot: new CreateRootUseCase(userRepository, passwordHasher, idGenerator),
    getAll: new GetAllUsersUseCase(userRepository),
    getByUsername: new GetUserByUsernameUseCase(userRepository),
    updatePassword: new UpdatePasswordUseCase(userRepository, passwordHasher),
    incrementSessionVersion: new IncrementSessionVersionUseCase(userRepository),
    verifyPassword: new VerifyPasswordUseCase(userRepository,passwordHasher),
    activate: new ActivateUserUseCase(userRepository),
    deactivate: new DeactivateUserUseCase(userRepository),
    getById: new GetUserByIdUseCase(userRepository),
    managePermission: new ManagePermissionUseCase(userRepository),
    getUserPermissions: new GetUserPermissionsUseCase(userRepository),
}

export const faqUseCases: IFaqUseCases = {
    createFaqItem: new CreateFaqItemUseCase(
        faqTextRepository,
        faqItemRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    updateFaqItem: new UpdateFaqItemUseCase(
        faqTextRepository,
        faqItemRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    deleteFaqItem: new DeleteFaqItemUseCase(
        faqItemRepository,
        faqTextRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    restoreFaqItem: new RestoreFaqItemUseCase(
        faqItemRepository,
        faqTextRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    listFaqItems: new ListFaqItemsUseCase(
        faqItemRepository,
        faqTextRepository,
        userRepository,
    ),
    getFaqItem: new GetFaqItemUseCase(faqItemRepository, faqTextRepository),
    getFaqHistory: new GetFaqHistoryUseCase(faqHistoryRepository, faqItemRepository, userRepository),
};

export const weeklyScheduleUseCases: IWeeklyScheduleUseCases = {
    create: new CreateWeeklyScheduleUseCase(
        weeklyScheduleRepository,
        weeklyScheduleHistoryRepository,
        fileRepository,
        userRepository,
        idGenerator,
    ),
    update: new UpdateWeeklyScheduleUseCase(
        weeklyScheduleRepository,
        weeklyScheduleHistoryRepository,
        fileRepository,
        userRepository,
        idGenerator,
    ),
    delete: new DeleteWeeklyScheduleUseCase(
        weeklyScheduleRepository,
        weeklyScheduleHistoryRepository,
        userRepository,
        idGenerator,
    ),
    restore: new RestoreWeeklyScheduleUseCase(
        weeklyScheduleRepository,
        weeklyScheduleHistoryRepository,
        userRepository,
        idGenerator,
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
};

export const mediaUseCases: IMediaUseCases = {
    uploadFile: new UploadFileUseCase(mediaService, fileRepository),
    deleteFile: new DeleteFileUseCase(mediaService, fileRepository),
    getFileUrl: new GetFileUrlUseCase(fileRepository, mediaService),
};

export async function startHttpServer(): Promise<void> {
    const hostname = Bun.env.HOSTNAME || "0.0.0.0";
    await createFastifyServer(
        Number(Bun.env.PORT),
        hostname,
        { userUseCases, faqUseCases, weeklyScheduleUseCases, mediaUseCases },
    );
}

export async function startCli(interactive: boolean = false): Promise<void> {
    await createCli(
        interactive,
        userUseCases,
    );
}
