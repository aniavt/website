import type { UserRepository } from "@domain/repositories/UserRepository";
import type { SecureHasher } from "@domain/services/SecureHasher";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { FAQPermission, ManagePermission, UserPermission, WeeklySchedulePermission } from "@domain/value-object/Permissions";
import { UserEntity } from "@domain/entities/User";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";
import { validatePassword, validateUsername } from "../utils";
import { type UserDto, toUserDto } from "../dto";


export interface CreateRootInput {
    username: string;
    password: string;
}

export class CreateRootUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: SecureHasher,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute({ username, password }: CreateRootInput): Promise<Result<UserDto, UserError>> {
        const usernameResult = validateUsername(username);
        if (usernameResult.isError()) {
            return usernameResult;
        }

        const passwordResult = validatePassword(password);
        if (passwordResult.isError()) {
            return passwordResult;
        }

        const existingUser = await this.userRepository.findByUsername(username);
        if (existingUser) {
            return err("username_already_exists");
        }

        const passwordHash = await this.passwordHasher.hash(password);
        const user = UserEntity.create(this.idGenerator.generateUUID(), username, passwordHash);

        user.permissions.meta = new ManagePermission().add(
            ManagePermission.META_MANAGE_PERMISSIONS,
            ManagePermission.MANAGE_USER,
            ManagePermission.MANAGE_FAQ,
            ManagePermission.MANAGE_WEEKLY_SCHEDULE,
        );
        
        user.permissions.user = new UserPermission().add(UserPermission.MANAGE_USER);
        user.permissions.faq = new FAQPermission().add(FAQPermission.MANAGE_FAQ);
        user.permissions.weekly_schedule = new WeeklySchedulePermission().add(WeeklySchedulePermission.MANAGE_WEEKLY_SCHEDULE);

        try {
            await this.userRepository.save(user);
        } catch (_error) {
            return err("user_save_failed");
        }

        return ok(toUserDto(user));
    }
}

