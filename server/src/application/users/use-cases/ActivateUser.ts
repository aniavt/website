import type { UserRepository } from "@domain/repositories/UserRepository";
import { UserPermission } from "@domain/value-object/Permissions";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";
import { assertPermission } from "@application/shared/auth";



export class ActivateUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(id: string, requesterId: string): Promise<Result<void, UserError>> {
        const auth = await assertPermission(
            this.userRepository,
            requesterId,
            { type: "user", permission: UserPermission.ACTIVATE_USER },
            "user_not_authorized",
        );
        if (auth.isError()) return auth;

        const user = await this.userRepository.findById(id);
        if (!user) {
            return err("user_not_found");
        }

        if (user.isActive) return ok(void 0);

        try {
            user.activate();
            await this.userRepository.save(user);
        } catch (error) {
            return err("user_save_failed");
        }

        return ok(void 0);
    }
}
