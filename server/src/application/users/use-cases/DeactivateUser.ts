import type { UserRepository } from "@domain/repositories/UserRepository";
import { ManagePermission, UserPermission } from "@domain/value-object/Permissions";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";


export class DeactivateUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(id: string, requesterId: string): Promise<Result<void, UserError>> {
        const user = await this.userRepository.findById(id);
        const requester = await this.userRepository.findById(requesterId);
        if (!user || !requester) {
            return err("user_not_found");
        }

        if (user.id !== requester.id && !requester.hasPermission({ type: "user", permission: UserPermission.DEACTIVATE_USER })) {
            return err("user_not_authorized");
        }

        if (user.hasPermission({ type: "meta", permission: ManagePermission.META_MANAGE_PERMISSIONS })
            || user.hasPermission({ type: "meta", permission: ManagePermission.MANAGE_USER })
        ) {
            return err("user_cannot_deactivate_root");
        }

        if (!user.isActive) return ok(void 0);

        try {
            user.deactivate();
            await this.userRepository.save(user);
        } catch (error) {
            return err("user_save_failed");
        }

        return ok(void 0);
    }
}
