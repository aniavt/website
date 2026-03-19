import type {
    VaultNodeEntity,
    VaultNodeSourceEntity,
    VaultNodeTagInfoEntity,
} from "@domain/entities/Vault";
import type { Result } from "@lib/result";
import type { VaultError } from "./errors";

export interface IVaultUseCases {
    // Tags (catálogo / búsqueda)
    createTag: {
        execute(requesterId: string, name: string): Promise<Result<VaultNodeTagInfoEntity, VaultError>>;
    };
    renameTag: {
        execute(requesterId: string, tagId: string, newName: string): Promise<Result<VaultNodeTagInfoEntity, VaultError>>;
    };
    deleteTag: {
        execute(requesterId: string, tagId: string): Promise<Result<void, VaultError>>;
    };
    listTags: {
        execute(): Promise<Result<VaultNodeTagInfoEntity[], VaultError>>;
    };
    findNodesByTag: {
        execute(requesterId: string | null, tagId: string): Promise<Result<VaultNodeEntity[], VaultError>>;
    };
    findNodesByTagName: {
        execute(requesterId: string | null, tagName: string): Promise<Result<VaultNodeEntity[], VaultError>>;
    };

    // Nodos (estructura base)
    createFolder: {
        execute(
            requesterId: string,
            input: { parentId: string | null; name: string; isPublic?: boolean },
        ): Promise<Result<VaultNodeEntity, VaultError>>;
    };
    createFileNode: {
        execute(requesterId: string, input: {
            parentId: string | null;
            name: string;
            sourceType: "external" | "internal";
            server: string | null;
            urlOrFileId: string;
            isPublic?: boolean;
        }): Promise<Result<{ node: VaultNodeEntity; source: VaultNodeSourceEntity }, VaultError>>;
    };
    renameNode: {
        execute(requesterId: string, nodeId: string, newName: string): Promise<Result<VaultNodeEntity, VaultError>>;
    };
    moveNode: {
        execute(requesterId: string, nodeId: string, newParentId: string | null): Promise<Result<VaultNodeEntity, VaultError>>;
    };
    deleteNode: {
        execute(requesterId: string, nodeId: string): Promise<Result<void, VaultError>>;
    };
    getNodeByParentAndName: {
        execute(
            requesterId: string | null,
            parentId: string | null,
            name: string,
        ): Promise<Result<VaultNodeEntity | null, VaultError>>;
    };
    getChildren: {
        execute(
            requesterId: string | null,
            parentId: string | null,
        ): Promise<Result<VaultNodeEntity[], VaultError>>;
    };

    // Tags en nodos
    addTagToNode: {
        execute(requesterId: string, nodeId: string, tagId: string): Promise<Result<void, VaultError>>;
    };
    removeTagFromNode: {
        execute(requesterId: string, nodeId: string, tagId: string): Promise<Result<void, VaultError>>;
    };
    getTagsForNode: {
        execute(requesterId: string | null, nodeId: string): Promise<Result<VaultNodeTagInfoEntity[], VaultError>>;
    };

    // Sources
    getSourcesForNode: {
        execute(requesterId: string | null, nodeId: string): Promise<Result<VaultNodeSourceEntity[], VaultError>>;
    };
    addSourceToNode: {
        execute(
            requesterId: string,
            input: {
                nodeId: string;
                type: "external" | "internal";
                server: string | null;
                urlOrFileId: string;
            },
        ): Promise<Result<VaultNodeSourceEntity, VaultError>>;
    };
    updateSource: {
        execute(
            requesterId: string,
            input: {
                sourceId: string;
                type?: "external" | "internal";
                server?: string | null;
                urlOrFileId?: string;
            },
        ): Promise<Result<VaultNodeSourceEntity, VaultError>>;
    };
    deleteSource: {
        execute(requesterId: string, sourceId: string): Promise<Result<void, VaultError>>;
    };

    // Visibilidad / metadata
    setThumbnail: {
        execute(
            requesterId: string,
            nodeId: string,
            thumbnailFileId: string | null,
        ): Promise<Result<VaultNodeEntity, VaultError>>;
    };
    setNodePublic: {
        execute(
            requesterId: string,
            nodeId: string,
            isPublic: boolean,
        ): Promise<Result<VaultNodeEntity, VaultError>>;
    };
}

