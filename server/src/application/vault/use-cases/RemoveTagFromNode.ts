import type { VaultService } from "@domain/services/VaultService";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { VaultError } from "../errors";

export class RemoveTagFromNodeUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requesterId: string,
        nodeId: string,
        tagId: string,
    ): Promise<Result<void, VaultError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("vault_not_authorized");
        if (!requester.hasPermission({ type: "vault", permission: VaultPermission.UPDATE_NODE })) {
            return err("vault_not_authorized");
        }

        return await this.vaultService.removeTagFromNode(nodeId, tagId);
    }
}

