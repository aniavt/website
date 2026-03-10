import type { UserRepository } from "@domain/repositories/UserRepository";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";


export class IncrementSessionVersionUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(id: string): Promise<Result<void, UserError>> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return err("user_not_found");
        }

        try {
            user.incrementSessionVersion();
            await this.userRepository.save(user);
        } catch (error) {
            return err("user_save_failed");
        }

        return ok(void 0);
    }
}
