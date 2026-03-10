import type { PaginationOptions, UserRepository } from "@domain/repositories/UserRepository";
import { UserPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { UserError } from "../errors";
import { type UserDto, toUserDto } from "../dto";


export class GetAllUsersUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(requesterId: string, options?: PaginationOptions): Promise<Result<UserDto[], UserError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) {
            return err("user_not_found");
        }

        if (!requester.hasPermission({ type: "user", permission: UserPermission.READ_USER })) {
            return err("user_not_authorized");
        }

        const users = await this.userRepository.findAll(options);
        return ok(users.map((user) => toUserDto(user)));
    }
}