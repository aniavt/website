import type { UserRepository } from "@domain/repositories/UserRepository";
import type { SecureHasher } from "@domain/services/SecureHasher";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { UserEntity } from "@domain/entities/User";
import { ManagePermission } from "@domain/value-object/Permissions";
import { type Result, err, ok } from "@lib/result";
import { assertPermission } from "@application/shared/auth";
import type { UserError } from "../errors";
import { validatePassword, validateUsername } from "../utils";
import { type UserDto, toUserDto, type CreateUserInput } from "../dto";

export type { CreateUserInput };

export class CreateUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: SecureHasher,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute(
        requesterId: string,
        { username, password }: CreateUserInput,
    ): Promise<Result<UserDto, UserError>> {
        const auth = await assertPermission(
            this.userRepository,
            requesterId,
            { type: "meta", permission: ManagePermission.META_MANAGE_PERMISSIONS },
            "user_not_authorized",
        );
        if (auth.isError()) {
            return auth;
        }

        const usernameResult = validateUsername(username);

        if (usernameResult.isError()) {
            return usernameResult;
        }

        const passwordResult = validatePassword(password);
        if (passwordResult.isError()) {
            return passwordResult;
        }

        const passwordHash = await this.passwordHasher.hash(password);
        const user = UserEntity.create(this.idGenerator.generateUUID(), username, passwordHash);

        try {
            await this.userRepository.save(user);
        } catch (error) {
            console.error("user_save_failed", error);
            return err("user_save_failed");
        }

        return ok(toUserDto(user));
    }
}
