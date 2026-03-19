import type { VaultService } from "@domain/services/VaultService";
import { err, ok, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeEntity } from "@domain/entities/Vault";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";

export class GetNodeByParentAndNameUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requesterId: string | null,
        parentId: string | null,
        name: string,
    ): Promise<Result<VaultNodeEntity | null, VaultError>> {
        const result = await this.vaultService.getNodeByParentAndName(parentId, name);
        if (result.isError()) {
            return result;
        }

        const node = result.data;
        if (!node || node.isPublic) return ok(node);

        if (!requesterId) return err("vault_not_authorized");

        const requester = await this.userRepository.findById(requesterId);
        if (!requester || !(
            requester.hasPermission({ type: "vault", permission: VaultPermission.CREATE_NODE }) ||
            requester.hasPermission({ type: "vault", permission: VaultPermission.UPDATE_NODE }) ||
            requester.hasPermission({ type: "vault", permission: VaultPermission.DELETE_NODE })
        )) {
            return err("vault_not_authorized");
        }

        return ok(node);
    }
}

