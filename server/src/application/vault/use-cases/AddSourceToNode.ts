import type { VaultService } from "@domain/services/VaultService";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeSourceEntity } from "@domain/entities/Vault";
import type { AddVaultSourceToNodeInput } from "../dto";

export type AddSourceToNodeInput = AddVaultSourceToNodeInput & { nodeId: string };

export class AddSourceToNodeUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requesterId: string,
        input: AddSourceToNodeInput,
    ): Promise<Result<VaultNodeSourceEntity, VaultError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("vault_not_authorized");

        const canUpdate =
            requester.hasPermission({ type: "vault", permission: VaultPermission.CREATE_NODE }) ||
            requester.hasPermission({ type: "vault", permission: VaultPermission.UPDATE_NODE });

        if (!canUpdate) return err("vault_not_authorized");

        if (!input.urlOrFileId) return err("vault_invalid_input");

        return await this.vaultService.addSourceToNode({
            ...input,
            urlOrFileId: input.urlOrFileId,
        });
    }
}

