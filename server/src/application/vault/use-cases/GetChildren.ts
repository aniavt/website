import type { VaultService } from "@domain/services/VaultService";
import { ok, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeEntity } from "@domain/entities/Vault";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";

export class GetChildrenUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requesterId: string | null,
        parentId: string | null,
    ): Promise<Result<VaultNodeEntity[], VaultError>> {
        let canReadPrivateNode = false;

        if (requesterId) {
            const requester = await this.userRepository.findById(requesterId);
            if (
                requester &&
                (
                    requester.hasPermission({ type: "vault", permission: VaultPermission.CREATE_NODE }) ||
                    requester.hasPermission({ type: "vault", permission: VaultPermission.UPDATE_NODE }) ||
                    requester.hasPermission({ type: "vault", permission: VaultPermission.DELETE_NODE })
                )
            ) {
                canReadPrivateNode = true;
            }
        }

        const result = await this.vaultService.getChildren(parentId);
        if (result.isError()) {
            return result;
        }

        const nodes = result.data;

        return ok(canReadPrivateNode ? nodes : nodes.filter(n => n.isPublic));
    }
}

