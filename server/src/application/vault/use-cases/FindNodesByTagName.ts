import type { VaultService } from "@domain/services/VaultService";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeEntity } from "@domain/entities/Vault";

export class FindNodesByTagNameUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string | null, tagName: string): Promise<Result<VaultNodeEntity[], VaultError>> {
        if (!tagName) {
            return err("vault_invalid_input");
        }

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

        const result = await this.vaultService.findNodesByTagName(tagName);
        if (result.isError()) {
            return result;
        }

        const nodes = result.data;

        return ok(canReadPrivateNode ? nodes : nodes.filter(n => n.isPublic));
    }
}

