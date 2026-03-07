import type { UserRepository } from "@domain/repositories/UserRepository";
import type { EventBus } from "@domain/services/EventBus";
import type { SecureHasher } from "@domain/services/SecureHasher";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";
import { validatePassword, validateUsername } from "../utils";
import { UserEntity } from "@domain/entities/User";
import { type UserDto, toUserDto } from "../dto";


export interface CreateUserInput {
    username: string;
    password: string;
}

export class CreateUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: SecureHasher,
        private readonly idGenerator: IdGenerator,
        private readonly eventBus: EventBus,
    ) {}

    async execute({ username, password }: CreateUserInput): Promise<Result<UserDto, UserError>> {
        const usernameResult = validateUsername(username);

        if (usernameResult.isError()) {
            return usernameResult;
        }

        const passwordResult = validatePassword(password);
        if (passwordResult.isError()) {
            return passwordResult;
        }

        const passwordHash = await this.passwordHasher.hash(password);
        const user = UserEntity.create(this.idGenerator.generateUserId(), username, passwordHash);

        try {
            await this.userRepository.save(user);
        } catch (error) {
            return err("user_save_failed");
        }

        await this.eventBus.publish(user.pullEvents());
        return ok(toUserDto(user));
    }
}
