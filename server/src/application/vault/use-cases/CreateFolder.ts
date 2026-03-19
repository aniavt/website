import type { VaultService } from "@domain/services/VaultService";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeEntity } from "@domain/entities/Vault";

export interface CreateFolderInput {
    parentId: string | null;
    name: string;
    isPublic?: boolean;
}

export class CreateFolderUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string, input: CreateFolderInput): Promise<Result<VaultNodeEntity, VaultError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("vault_not_authorized");

        if (!requester.hasPermission({ type: "vault", permission: VaultPermission.CREATE_NODE })) {
            return err("vault_not_authorized");
        }

        return await this.vaultService.createFolder(input.parentId, input.name, input.isPublic ?? false);
    }
}

