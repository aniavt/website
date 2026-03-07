import type { EventBus } from "@domain/services/EventBus";
import type { UserError } from "../errors";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { err, ok, type Result } from "@lib/result";



export class RevokeRootUseCase {
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

        if (!requester.isRoot || user.id === requester.id) {
            return err("user_not_authorized");
        }

        if (!user.isRoot) return ok(void 0);

        try {
            user.revokeRoot();
            await this.userRepository.save(user);
        } catch (error) {
            return err("user_save_failed");
        }

        await this.eventBus.publish(user.pullEvents());
        return ok(void 0);
    }
}
