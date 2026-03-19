import type { VaultService } from "@domain/services/VaultService";
import { type Result } from "@lib/result";
import type { VaultError } from "../errors";
import type { VaultNodeTagInfoEntity } from "@domain/entities/Vault";

export class ListTagsUseCase {
    constructor(private readonly vaultService: VaultService) {}

    async execute(): Promise<Result<VaultNodeTagInfoEntity[], VaultError>> {
        return await this.vaultService.listTags();
    }
}

