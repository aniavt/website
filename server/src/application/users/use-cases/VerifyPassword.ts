import type { UserRepository } from "@domain/repositories/UserRepository";
import type { SecureHasher } from "@domain/services/SecureHasher";
import { err, ok, type Result } from "@lib/result";
import type { UserError } from "../errors";



export class VerifyPasswordUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: SecureHasher,
    ) {}

    async execute(id: string, password: string): Promise<Result<void, UserError>> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return err("user_not_found");
        }

        const isPasswordCorrect = await this.passwordHasher.verify(password, user.passwordHash);
        if (!isPasswordCorrect) {
            return err("password_verify_failed");
        }

        return ok(void 0);
    }
}
