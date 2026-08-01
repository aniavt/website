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
import { LoginUseCase } from "@application/users/use-cases/Login";
import { MongoDbUserRepository } from "@infrastructure/UserRepository/MongoDb";

import { mongoClient, passwordHasher, idGenerator } from "./infra";

export const userRepository = new MongoDbUserRepository(mongoClient);

export const userUseCases: IUserUseCases = {
    create: new CreateUserUseCase(userRepository, passwordHasher, idGenerator),
    createRoot: new CreateRootUseCase(userRepository, passwordHasher, idGenerator),
    getAll: new GetAllUsersUseCase(userRepository),
    getByUsername: new GetUserByUsernameUseCase(userRepository),
    updatePassword: new UpdatePasswordUseCase(userRepository, passwordHasher),
    incrementSessionVersion: new IncrementSessionVersionUseCase(userRepository),
    verifyPassword: new VerifyPasswordUseCase(userRepository, passwordHasher),
    activate: new ActivateUserUseCase(userRepository),
    deactivate: new DeactivateUserUseCase(userRepository),
    getById: new GetUserByIdUseCase(userRepository),
    managePermission: new ManagePermissionUseCase(userRepository),
    getUserPermissions: new GetUserPermissionsUseCase(userRepository),
    login: new LoginUseCase(userRepository, passwordHasher),
};
