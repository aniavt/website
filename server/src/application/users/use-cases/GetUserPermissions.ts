import type { UserRepository } from "@domain/repositories/UserRepository";
import { ManagePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { UserError } from "../errors";
import type { UserDto } from "../dto";
import { toUserDto } from "../dto";


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

        const [user, requester] = await Promise.all([
            this.userRepository.findById(userId),
            this.userRepository.findById(requesterId),
        ]);

        if (!user || !requester) {
            return err("user_not_found");
        }

        const isSelf = user.id === requester.id;
        const canManageUser = requester.hasPermission({ type: "meta", permission: ManagePermission.MANAGE_USER });

        if (!isSelf && !canManageUser) {
            return err("user_not_authorized");
        }

        return ok({ permissions: toUserDto(user).permissions });
    }
}

