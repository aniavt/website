// 
import mongoose from "mongoose";


// Services
import { Bus } from "@infrastructure/EventBus";
import { ArgonIdSecureHasher } from "@infrastructure/ArgonIdSecureHasher";
import { CryptoIdGenerator } from "@infrastructure/CryptoIdGenerator";

// Repositories
import { InMemoryUserRepository } from "@infrastructure/UserRepository/InMemory";
import { MongoDbUserRepository } from "@infrastructure/UserRepository/MongoDb";
import { MongoDbFaqTextRepository } from "@infrastructure/FaqTextRepository/MongoDb";
import { MongoDbFaqItemRepository } from "@infrastructure/FaqItemRepository/MongoDb";
import { MongoDbFaqHistoryRepository } from "@infrastructure/FaqHistoryRepository/MongoDb";

// Use Cases
import type { IUserUseCases } from "@application/users/IUserUseCases";
import { ActivateUserUseCase } from "@application/users/use-cases/ActivateUser";
import { CreateUserUseCase } from "@application/users/use-cases/CreateUser";
import { BootstrapRootUseCase } from "@application/users/use-cases/BootstrapRoot";
import { DeactivateUserUseCase } from "@application/users/use-cases/DeactivateUser";
import { GetAllUsersUseCase } from "@application/users/use-cases/GetAllUsers";
import { GetUserByIdUseCase } from "@application/users/use-cases/GetUserById";
import { GetUserByUsernameUseCase } from "@application/users/use-cases/GetUserByUsername";
import { GrantAdminUseCase } from "@application/users/use-cases/GrantAdmin";
import { GrantRootUseCase } from "@application/users/use-cases/GrantRoot";
import { IncrementSessionVersionUseCase } from "@application/users/use-cases/IncrementSessionVersion";
import { RevokeAdminUseCase } from "@application/users/use-cases/RevokeAdmin";
import { RevokeRootUseCase } from "@application/users/use-cases/RevokeRoot";
import { UpdatePasswordUseCase } from "@application/users/use-cases/UpdatePassword";
import { VerifyPasswordUseCase } from "@application/users/use-cases/VerifyPassword";

import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import { CreateFaqItemUseCase } from "@application/faq/use-cases/CreateFaqItem";
import { UpdateFaqItemUseCase } from "@application/faq/use-cases/UpdateFaqItem";
import { DeleteFaqItemUseCase } from "@application/faq/use-cases/DeleteFaqItem";
import { RestoreFaqItemUseCase } from "@application/faq/use-cases/RestoreFaqItem";
import { ListFaqItemsUseCase } from "@application/faq/use-cases/ListFaqItems";
import { GetFaqItemUseCase } from "@application/faq/use-cases/GetFaqItem";
import { GetFaqHistoryUseCase } from "@application/faq/use-cases/GetFaqHistory";

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
const eventBus = new Bus();
const passwordHasher = new ArgonIdSecureHasher();
const idGenerator = new CryptoIdGenerator();
// const userRepository = new InMemoryUserRepository();
const userRepository = new MongoDbUserRepository(mongoClient);
const faqTextRepository = new MongoDbFaqTextRepository(mongoClient);
const faqItemRepository = new MongoDbFaqItemRepository(mongoClient);
const faqHistoryRepository = new MongoDbFaqHistoryRepository(mongoClient);

export const userUseCases: IUserUseCases = {
    create: new CreateUserUseCase(
        userRepository,
        passwordHasher,
        idGenerator,
        eventBus,
    ),
    bootstrapRoot: new BootstrapRootUseCase(
        userRepository,
        passwordHasher,
        idGenerator,
        eventBus,
    ),
    getAll: new GetAllUsersUseCase(
        userRepository,
    ),
    getByUsername: new GetUserByUsernameUseCase(
        userRepository,
    ),
    updatePassword: new UpdatePasswordUseCase(
        userRepository,
        passwordHasher,
        eventBus,
    ),
    incrementSessionVersion: new IncrementSessionVersionUseCase(
        userRepository,
        eventBus,
    ),
    grantAdmin: new GrantAdminUseCase(
        userRepository,
        eventBus,
    ),
    revokeAdmin: new RevokeAdminUseCase(
        userRepository,
        eventBus,
    ),
    grantRoot: new GrantRootUseCase(
        userRepository,
        eventBus,
    ),
    revokeRoot: new RevokeRootUseCase(
        userRepository,
        eventBus,
    ),
    verifyPassword: new VerifyPasswordUseCase(
        userRepository,
        passwordHasher,
    ),
    activate: new ActivateUserUseCase(
        userRepository,
        eventBus,
    ),
    deactivate: new DeactivateUserUseCase(
        userRepository,
        eventBus,
    ),
    getById: new GetUserByIdUseCase(
        userRepository,
    ),
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
    listFaqItems: new ListFaqItemsUseCase(faqItemRepository, faqTextRepository),
    getFaqItem: new GetFaqItemUseCase(faqItemRepository, faqTextRepository),
    getFaqHistory: new GetFaqHistoryUseCase(faqHistoryRepository, faqItemRepository, userRepository),
};

export async function startHttpServer(): Promise<void> {
    const hostname = Bun.env.HOSTNAME || "0.0.0.0";
    await createFastifyServer(
        Number(Bun.env.PORT),
        hostname,
        { userUseCases, faqUseCases },
    );
}

export async function startCli(interactive: boolean = false): Promise<void> {
    await createCli(
        interactive,
        userUseCases,
    );
}