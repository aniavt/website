import type {
    VaultNodeEntity,
    VaultNodeSourceEntity,
    VaultNodeTagInfoEntity,
} from "@domain/entities/Vault";
import type {
    VaultNodeDto,
    VaultNodeSourceDto,
    VaultTagDto,
} from "@ania/api-contract/vault";

export type {
    VaultNodeDto,
    VaultNodeSourceDto,
    VaultTagDto,
    VaultNodeType,
    VaultSourceType,
    CreateVaultFolderInput,
    CreateVaultFileNodeInput,
    MoveVaultNodeInput,
    RenameVaultNodeInput,
    SetVaultNodePublicInput,
    SetVaultThumbnailInput,
    CreateVaultTagInput,
    RenameVaultTagInput,
    AddVaultSourceToNodeInput,
    UpdateVaultSourceInput,
} from "@ania/api-contract/vault";

export function toVaultNodeDto(entity: VaultNodeEntity): VaultNodeDto {
    return {
        id: entity.id,
        parentId: entity.parentId,
        name: entity.name,
        type: entity.type,
        createdAt: entity.createdAt ? entity.createdAt.toISOString() : null,
        thumbnailId: entity.thumbnailId,
        isPublic: entity.isPublic,
    };
}

export function toVaultNodeSourceDto(entity: VaultNodeSourceEntity): VaultNodeSourceDto {
    return {
        id: entity.id,
        nodeId: entity.nodeId,
        type: entity.type,
        server: entity.server,
        url: entity.url,
        createdAt: entity.createdAt.toISOString(),
    };
}

export function toVaultTagDto(entity: VaultNodeTagInfoEntity): VaultTagDto {
    return {
        id: entity.id,
        name: entity.name,
    };
}
