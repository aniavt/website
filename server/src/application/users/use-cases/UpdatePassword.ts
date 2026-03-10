import type { SecureHasher } from "@domain/services/SecureHasher";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";

export class UpdatePasswordUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: SecureHasher,
    ) {}

    async execute(id: string, password: string): Promise<Result<void, UserError>> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return err("user_not_found");
        }

        const newPasswordHash = await this.passwordHasher.hash(password);
        user.updatePassword(newPasswordHash);
        try {
            await this.userRepository.save(user);
        } catch (error) {
            return err("user_save_failed");
        }

        return ok(void 0);
    }
}
