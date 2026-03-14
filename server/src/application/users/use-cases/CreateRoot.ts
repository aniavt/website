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
        
        user.permissions.user = new UserPermission().add(
            UserPermission.READ_USER,
            UserPermission.ASSIGN_READ_USER,
            UserPermission.REVOKE_READ_USER,
            UserPermission.ACTIVATE_USER,
            UserPermission.ASSIGN_ACTIVATE_USER,
            UserPermission.REVOKE_ACTIVATE_USER,
            UserPermission.DEACTIVATE_USER,
            UserPermission.ASSIGN_DEACTIVATE_USER,
            UserPermission.REVOKE_DEACTIVATE_USER,
        );

        user.permissions.faq = new FAQPermission().add(
            FAQPermission.READ_FAQ,
            FAQPermission.ASSIGN_READ_FAQ,
            FAQPermission.REVOKE_READ_FAQ,
            FAQPermission.CREATE_FAQ,
            FAQPermission.ASSIGN_CREATE_FAQ,
            FAQPermission.REVOKE_CREATE_FAQ,
            FAQPermission.RESTORE_FAQ,
            FAQPermission.ASSIGN_RESTORE_FAQ,
            FAQPermission.REVOKE_RESTORE_FAQ,
            FAQPermission.DELETE_FAQ,
            FAQPermission.ASSIGN_DELETE_FAQ,
            FAQPermission.REVOKE_DELETE_FAQ,
            FAQPermission.UPDATE_FAQ,
            FAQPermission.ASSIGN_UPDATE_FAQ,
            FAQPermission.REVOKE_UPDATE_FAQ,
        );

        user.permissions.weekly_schedule = new WeeklySchedulePermission().add(
            WeeklySchedulePermission.CREATE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.ASSIGN_CREATE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.REVOKE_CREATE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.ASSIGN_DELETE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.REVOKE_DELETE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.UPDATE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.ASSIGN_UPDATE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.REVOKE_UPDATE_WEEKLY_SCHEDULE,
            WeeklySchedulePermission.READ_WEEKLY_SCHEDULE_HISTORY,
            WeeklySchedulePermission.ASSIGN_READ_WEEKLY_SCHEDULE_HISTORY,
            WeeklySchedulePermission.REVOKE_READ_WEEKLY_SCHEDULE_HISTORY,
        );

        try {
            await this.userRepository.save(user);
        } catch (_error) {
            return err("user_save_failed");
        }

        return ok(toUserDto(user));
    }
}

