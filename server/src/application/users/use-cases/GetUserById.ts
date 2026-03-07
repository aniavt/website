import type { UserRepository } from "@domain/repositories/UserRepository";
import { type Result, err, ok } from "@lib/result";
import type { UserError } from "../errors";
import { type UserDto, toUserDto } from "../dto";


export class GetUserByIdUseCase {
    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async execute(id: string): Promise<Result<UserDto, UserError>> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return err("user_not_found");
        }

        return ok(toUserDto(user));
    }
}
