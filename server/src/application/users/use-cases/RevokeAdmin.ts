import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserError } from "../errors";
import { err, ok, type Result } from "@lib/result";
import type { EventBus } from "@domain/services/EventBus";


export class RevokeAdminUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(id: string, requesterId: string): Promise<Result<void, UserError>> {
        const user = await this.userRepository.findById(id);
        const requester = await this.userRepository.findById(requesterId);
        if (!user || !requester) {
            return err("user_not_found");
        }

        // Only the user themselves or a root user can revoke admin privileges
        if (user.id !== requester.id && !requester.isRoot) {
            return err("user_not_authorized");
        }

        if (!user.isAdmin) return ok(void 0);

        try {
            user.revokeAdmin();
            await this.userRepository.save(user);
        } catch (error) {
            return err("user_save_failed");
        }

        await this.eventBus.publish(user.pullEvents());
        return ok(void 0);
    }
}
