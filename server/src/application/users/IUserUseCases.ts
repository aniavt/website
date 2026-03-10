import type { CreateUserUseCase } from "./use-cases/CreateUser";
import type { GetAllUsersUseCase } from "./use-cases/GetAllUsers";
import type { GetUserByUsernameUseCase } from "./use-cases/GetUserByUsername";
import type { UpdatePasswordUseCase } from "./use-cases/UpdatePassword";
import type { IncrementSessionVersionUseCase } from "./use-cases/IncrementSessionVersion";
import type { VerifyPasswordUseCase } from "./use-cases/VerifyPassword";
import type { ActivateUserUseCase } from "./use-cases/ActivateUser";
import type { DeactivateUserUseCase } from "./use-cases/DeactivateUser";
import type { GetUserByIdUseCase } from "./use-cases/GetUserById";
import type { CreateRootUseCase } from "./use-cases/CreateRoot";
import type { ManagePermissionUseCase } from "./use-cases/ManagePermission";
import type { GetUserPermissionsUseCase } from "./use-cases/GetUserPermissions";


export interface IUserUseCases {
    create: CreateUserUseCase;
    getAll: GetAllUsersUseCase;
    getByUsername: GetUserByUsernameUseCase;
    updatePassword: UpdatePasswordUseCase;
    incrementSessionVersion: IncrementSessionVersionUseCase;
    verifyPassword: VerifyPasswordUseCase;
    activate: ActivateUserUseCase;
    deactivate: DeactivateUserUseCase;
    getById: GetUserByIdUseCase;
    createRoot: CreateRootUseCase;
    managePermission: ManagePermissionUseCase;
    getUserPermissions: GetUserPermissionsUseCase;
}