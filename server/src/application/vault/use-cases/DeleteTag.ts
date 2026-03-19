import type { VaultService } from "@domain/services/VaultService";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { ManagePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { VaultError } from "../errors";

export class DeleteTagUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string, tagId: string): Promise<Result<void, VaultError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("vault_not_authorized");
        if (!requester.hasPermission({ type: "meta", permission: ManagePermission.MANAGE_VAULT })) {
            return err("vault_not_authorized");
        }

        return await this.vaultService.deleteTag(tagId);
    }
}

