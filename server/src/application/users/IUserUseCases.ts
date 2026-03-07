import type { CreateUserUseCase } from "./use-cases/CreateUser";
import type { GetAllUsersUseCase } from "./use-cases/GetAllUsers";
import type { GetUserByUsernameUseCase } from "./use-cases/GetUserByUsername";
import type { UpdatePasswordUseCase } from "./use-cases/UpdatePassword";
import type { IncrementSessionVersionUseCase } from "./use-cases/IncrementSessionVersion";
import type { GrantAdminUseCase } from "./use-cases/GrantAdmin";
import type { RevokeAdminUseCase } from "./use-cases/RevokeAdmin";
import type { GrantRootUseCase } from "./use-cases/GrantRoot";
import type { RevokeRootUseCase } from "./use-cases/RevokeRoot";
import type { VerifyPasswordUseCase } from "./use-cases/VerifyPassword";
import type { ActivateUserUseCase } from "./use-cases/ActivateUser";
import type { DeactivateUserUseCase } from "./use-cases/DeactivateUser";
import type { GetUserByIdUseCase } from "./use-cases/GetUserById";
import type { BootstrapRootUseCase } from "./use-cases/BootstrapRoot";


export interface IUserUseCases {
    create: CreateUserUseCase;
    getAll: GetAllUsersUseCase;
    getByUsername: GetUserByUsernameUseCase;
    updatePassword: UpdatePasswordUseCase;
    incrementSessionVersion: IncrementSessionVersionUseCase;
    grantAdmin: GrantAdminUseCase;
    revokeAdmin: RevokeAdminUseCase;
    grantRoot: GrantRootUseCase;
    revokeRoot: RevokeRootUseCase;
    verifyPassword: VerifyPasswordUseCase;
    activate: ActivateUserUseCase;
    deactivate: DeactivateUserUseCase;
    getById: GetUserByIdUseCase;
    bootstrapRoot: BootstrapRootUseCase;
}