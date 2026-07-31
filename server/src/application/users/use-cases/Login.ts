import type { UserRepository } from "@domain/repositories/UserRepository";
import type { SecureHasher } from "@domain/services/SecureHasher";
import { err, ok, type Result } from "@lib/result";
import type { UserError } from "../errors";
import { type UserDto, toUserDto } from "../dto";

export interface LoginInput {
    readonly username: string;
    readonly password: string;
}

export class LoginUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: SecureHasher,
    ) {}

    async execute(input: LoginInput): Promise<Result<UserDto, UserError>> {
        const user = await this.userRepository.findByUsername(input.username);
        // Same error whether user is missing or password is wrong (no user enumeration).
        if (!user) {
            return err("password_verify_failed");
        }

        const isPasswordCorrect = await this.passwordHasher.verify(input.password, user.passwordHash);
        if (!isPasswordCorrect) {
            return err("password_verify_failed");
        }

        return ok(toUserDto(user));
    }
}
