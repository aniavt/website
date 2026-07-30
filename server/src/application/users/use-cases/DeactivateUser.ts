import type { UserRepository } from "@domain/repositories/UserRepository";
import { ManagePermission, UserPermission } from "@domain/value-object/Permissions";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";
import { assertPermission } from "@application/shared/auth";


export class DeactivateUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(id: string, requesterId: string): Promise<Result<void, UserError>> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return err("user_not_found");
        }

        // Self-deactivate is allowed without DEACTIVATE_USER; others need the permission.
        // If self, `user` already proves the requester exists (same id).
        if (user.id !== requesterId) {
            const auth = await assertPermission(
                this.userRepository,
                requesterId,
                { type: "user", permission: UserPermission.DEACTIVATE_USER },
                "user_not_authorized",
            );
            if (auth.isError()) return auth;
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
