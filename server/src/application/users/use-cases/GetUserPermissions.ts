import type { UserRepository } from "@domain/repositories/UserRepository";
import { ManagePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { UserError } from "../errors";
import type { UserDto } from "../dto";
import { toUserDto } from "../dto";
import { assertPermission } from "@application/shared/auth";


export interface GetUserPermissionsInput {
    userId: string;
    requesterId: string;
}

export interface GetUserPermissionsOutput {
    permissions: UserDto["permissions"];
}

export class GetUserPermissionsUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: GetUserPermissionsInput): Promise<Result<GetUserPermissionsOutput, UserError>> {
        const { userId, requesterId } = input;

        const user = await this.userRepository.findById(userId);
        if (!user) {
            return err("user_not_found");
        }

        // Self-read is allowed; others need MANAGE_USER.
        // If self, `user` already proves the requester exists (same id).
        if (user.id !== requesterId) {
            const auth = await assertPermission(
                this.userRepository,
                requesterId,
                { type: "meta", permission: ManagePermission.MANAGE_USER },
                "user_not_authorized",
            );
            if (auth.isError()) return auth;
        }

        return ok({ permissions: toUserDto(user).permissions });
    }
}
