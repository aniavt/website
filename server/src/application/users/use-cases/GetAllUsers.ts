import type { PaginationOptions, UserRepository } from "@domain/repositories/UserRepository";
import { UserPermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { UserError } from "../errors";
import { type UserDto, toUserDto } from "../dto";
import { assertPermission } from "@application/shared/auth";


export class GetAllUsersUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(requesterId: string, options?: PaginationOptions): Promise<Result<UserDto[], UserError>> {
        const auth = await assertPermission(
            this.userRepository,
            requesterId,
            { type: "user", permission: UserPermission.READ_USER },
            "user_not_authorized",
        );
        if (auth.isError()) return auth;

        const users = await this.userRepository.findAll(options);
        return ok(users.map((user) => toUserDto(user)));
    }
}
