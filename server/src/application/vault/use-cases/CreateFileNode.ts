import type { VaultService } from "@domain/services/VaultService";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { VaultPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeEntity, VaultNodeSourceEntity } from "@domain/entities/Vault";

export interface CreateFileNodeInput {
    parentId: string | null;
    name: string;
    sourceType: "external" | "internal";
    server: string | null;
    urlOrFileId: string;
    isPublic?: boolean;
}

export class CreateFileNodeUseCase {
    constructor(
        private readonly vaultService: VaultService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requesterId: string,
        input: CreateFileNodeInput,
    ): Promise<Result<{ node: VaultNodeEntity; source: VaultNodeSourceEntity }, VaultError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("vault_not_authorized");

        if (!requester.hasPermission({ type: "vault", permission: VaultPermission.CREATE_NODE })) {
            return err("vault_not_authorized");
        }

        return await this.vaultService.createFileNode(input);
    }
}

