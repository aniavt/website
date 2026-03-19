import type { VaultService } from "@domain/services/VaultService";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeEntity } from "@domain/entities/Vault";

export class SetNodePublicUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requesterId: string,
        nodeId: string,
        isPublic: boolean,
    ): Promise<Result<VaultNodeEntity, VaultError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("vault_not_authorized");

        if (!requester.hasPermission({ type: "vault", permission: VaultPermission.UPDATE_NODE })) {
            return err("vault_not_authorized");
        }

        return this.vaultService.setNodePublic(nodeId, isPublic);
    }
}

