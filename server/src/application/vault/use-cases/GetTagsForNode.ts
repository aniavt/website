import type { VaultService } from "@domain/services/VaultService";
import { err, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeTagInfoEntity } from "@domain/entities/Vault";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";

export class GetTagsForNodeUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requesterId: string | null,
        nodeId: string,
    ): Promise<Result<VaultNodeTagInfoEntity[], VaultError>> {
        const resultNode = await this.vaultService.getNodeById(nodeId);
        if (resultNode.isError()) {
            return err(resultNode.error ?? "vault_repository_error");
        }

        const node = resultNode.data;
        if (!node) {
            return err("vault_node_not_found");
        }

        if (node.isPublic) {
            return await this.vaultService.getTagsForNode(nodeId);
        }

        if (!requesterId) return err("vault_not_authorized");

        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("vault_not_authorized");
        

        const canReadPrivateNode =
            requester.hasPermission({ type: "vault", permission: VaultPermission.CREATE_NODE }) ||
            requester.hasPermission({ type: "vault", permission: VaultPermission.UPDATE_NODE }) ||
            requester.hasPermission({ type: "vault", permission: VaultPermission.DELETE_NODE });

        if (!canReadPrivateNode) return err("vault_not_authorized");

        return await this.vaultService.getTagsForNode(nodeId);
    }
}

