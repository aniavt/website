import {
    VaultNodeEntity,
    VaultNodeSourceEntity,
    VaultNodeTagInfoEntity,
    VaultNodeTagEntity,
} from "@domain/entities/Vault";
import type {
    VaultNodeRepository,
    VaultNodeSourceRepository,
    VaultNodeTagInfoRepository,
    VaultNodeTagRepository,
} from "@domain/repositories/VaultRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { FileRepository } from "@domain/repositories/FileRepository";
import { err, ok, type Result } from "@lib/result";

export type VaultDomainError =
    | "vault_invalid_input"
    | "vault_invalid_parent"
    | "vault_duplicate_name"
    | "vault_tag_duplicate_name"
    | "vault_file_not_found"
    | "vault_node_not_found"
    | "vault_tag_not_found"
    | "vault_repository_error";

export class VaultService {
    constructor(
        private readonly nodeRepository: VaultNodeRepository,
        private readonly sourceRepository: VaultNodeSourceRepository,
        private readonly tagInfoRepository: VaultNodeTagInfoRepository,
        private readonly tagRepository: VaultNodeTagRepository,
        private readonly idGenerator: IdGenerator,
        private readonly fileRepository: FileRepository,
    ) {}

    async createFolder(
        parentId: string | null,
        name: string,
        isPublic: boolean = false,
    ): Promise<Result<VaultNodeEntity, VaultDomainError>> {
        if (!name) {
            return err("vault_invalid_input");
        }

        if (parentId !== null) {
            const parent = await this.nodeRepository.findById(parentId);
            if (!parent || parent.type !== "folder") {
                return err("vault_invalid_parent");
            }
        }

        const nameExists = await this.hasSiblingWithName(parentId, name);
        if (nameExists) {
            return err("vault_duplicate_name");
        }

        const id = this.idGenerator.generateUUID();
        const now = new Date();
        const node = new VaultNodeEntity({
            id,
            parentId,
            name,
            type: "folder",
            createdAt: now,
            thumbnailId: null,
            isPublic,
        });

        try {
            await this.nodeRepository.save(node);
        } catch {
            return err("vault_repository_error");
        }

        return ok(node);
    }

    async createFileNode(params: {
        parentId: string | null;
        name: string;
        sourceType: "external" | "internal";
        server: string | null;
        urlOrFileId: string;
        isPublic?: boolean;
    }): Promise<Result<{ node: VaultNodeEntity; source: VaultNodeSourceEntity }, VaultDomainError>> {
        const { parentId, name, sourceType, server, urlOrFileId, isPublic = false } = params;

        if (!name || !urlOrFileId) {
            return err("vault_invalid_input");
        }

        if (parentId !== null) {
            const parent = await this.nodeRepository.findById(parentId);
            if (!parent || parent.type !== "folder") {
                return err("vault_invalid_parent");
            }
        }

        const nameExists = await this.hasSiblingWithName(parentId, name);
        if (nameExists) {
            return err("vault_duplicate_name");
        }

        if (sourceType === "internal") {
            const file = await this.fileRepository.findById(urlOrFileId);
            if (!file) {
                return err("vault_file_not_found");
            }
        }

        const now = new Date();
        const nodeId = this.idGenerator.generateUUID();
        const node = new VaultNodeEntity({
            id: nodeId,
            parentId,
            name,
            type: "file",
            createdAt: now,
            thumbnailId: null,
            isPublic,
        });

        const sourceId = this.idGenerator.generateUUID();
        const source = new VaultNodeSourceEntity({
            id: sourceId,
            nodeId,
            type: sourceType,
            server,
            url: urlOrFileId,
            createdAt: now,
        });

        try {
            await this.nodeRepository.save(node);
            await this.sourceRepository.save(source);
        } catch {
            return err("vault_repository_error");
        }

        return ok({ node, source });
    }

    async renameNode(nodeId: string, newName: string): Promise<Result<VaultNodeEntity, VaultDomainError>> {
        if (!newName) {
            return err("vault_invalid_input");
        }

        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        const nameExists = await this.hasSiblingWithName(node.parentId, newName, node.id);
        if (nameExists) {
            return err("vault_duplicate_name");
        }

        const updated = new VaultNodeEntity({
            id: node.id,
            parentId: node.parentId,
            name: newName,
            type: node.type,
            createdAt: node.createdAt,
            thumbnailId: node.thumbnailId,
            isPublic: node.isPublic,
        });

        try {
            await this.nodeRepository.save(updated);
        } catch {
            return err("vault_repository_error");
        }

        return ok(updated);
    }

    async moveNode(nodeId: string, newParentId: string | null): Promise<Result<VaultNodeEntity, VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        if (newParentId !== null) {
            if (newParentId === node.id) {
                return err("vault_invalid_parent");
            }
            const parent = await this.nodeRepository.findById(newParentId);
            if (!parent || parent.type !== "folder") {
                return err("vault_invalid_parent");
            }
        }

        const nameExists = await this.hasSiblingWithName(newParentId, node.name);
        if (nameExists) {
            return err("vault_duplicate_name");
        }

        const updated = new VaultNodeEntity({
            id: node.id,
            parentId: newParentId,
            name: node.name,
            type: node.type,
            createdAt: node.createdAt,
            thumbnailId: node.thumbnailId,
            isPublic: node.isPublic,
        });

        try {
            await this.nodeRepository.save(updated);
        } catch {
            return err("vault_repository_error");
        }

        return ok(updated);
    }

    private async hasSiblingWithName(
        parentId: string | null,
        name: string,
        excludeNodeId?: string,
    ): Promise<boolean> {
        const existing = await this.nodeRepository.findByParentAndName(parentId, name);
        return existing != null && (excludeNodeId == null || existing.id !== excludeNodeId);
    }

    async getNodeByParentAndName(
        parentId: string | null,
        name: string,
    ): Promise<Result<VaultNodeEntity | null, VaultDomainError>> {
        try {
            const node = await this.nodeRepository.findByParentAndName(parentId, name);
            return ok(node);
        } catch {
            return err("vault_repository_error");
        }
    }

    async getNodeById(nodeId: string): Promise<Result<VaultNodeEntity | null, VaultDomainError>> {
        try {
            const node = await this.nodeRepository.findById(nodeId);
            return ok(node);
        } catch {
            return err("vault_repository_error");
        }
    }

    async deleteNode(nodeId: string): Promise<Result<void, VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        try {
            if (node.type === "folder") {
                const children = await this.nodeRepository.findChildren(node.id);
                for (const child of children) {
                    const childResult = await this.deleteNode(child.id);
                    if (childResult.isError()) {
                        return childResult;
                    }
                }
            }

            await this.nodeRepository.delete(nodeId);
            await this.sourceRepository.deleteByNodeId(nodeId);

            const tags = await this.tagRepository.findByNodeId(nodeId);
            for (const tag of tags) {
                await this.tagRepository.remove(tag.nodeId, tag.tagId);
            }
        } catch {
            return err("vault_repository_error");
        }

        return ok(void 0);
    }

    async getChildren(parentId: string | null): Promise<Result<VaultNodeEntity[], VaultDomainError>> {
        try {
            const nodes = await this.nodeRepository.findChildren(parentId);
            return ok(nodes);
        } catch {
            return err("vault_repository_error");
        }
    }

    async addTagToNode(nodeId: string, tagId: string): Promise<Result<void, VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        const tagInfo = await this.tagInfoRepository.findById(tagId);
        if (!tagInfo) {
            return err("vault_tag_not_found");
        }

        try {
            await this.tagRepository.add(
                new VaultNodeTagEntity({
                    nodeId,
                    tagId,
                }),
            );
        } catch {
            return err("vault_repository_error");
        }

        return ok(void 0);
    }

    async createTag(name: string): Promise<Result<VaultNodeTagInfoEntity, VaultDomainError>> {
        if (!name) {
            return err("vault_invalid_input");
        }

        try {
            const existing = await this.tagInfoRepository.findByName(name);
            if (existing) {
                return err("vault_tag_duplicate_name");
            }

            const id = this.idGenerator.generateUUID();
            const tag = new VaultNodeTagInfoEntity({
                id,
                name,
            });

            await this.tagInfoRepository.save(tag);
            return ok(tag);
        } catch {
            return err("vault_repository_error");
        }
    }

    async renameTag(tagId: string, newName: string): Promise<Result<VaultNodeTagInfoEntity, VaultDomainError>> {
        if (!newName) {
            return err("vault_invalid_input");
        }

        try {
            const tag = await this.tagInfoRepository.findById(tagId);
            if (!tag) {
                return err("vault_tag_not_found");
            }

            const existingWithName = await this.tagInfoRepository.findByName(newName);
            if (existingWithName && existingWithName.id !== tagId) {
                return err("vault_tag_duplicate_name");
            }

            const updated = new VaultNodeTagInfoEntity({
                id: tag.id,
                name: newName,
            });

            await this.tagInfoRepository.save(updated);
            return ok(updated);
        } catch {
            return err("vault_repository_error");
        }
    }

    async deleteTag(tagId: string): Promise<Result<void, VaultDomainError>> {
        try {
            const tag = await this.tagInfoRepository.findById(tagId);
            if (!tag) {
                return err("vault_tag_not_found");
            }

            await this.tagRepository.deleteByTagId(tagId);
            await this.tagInfoRepository.deleteById(tagId);

            return ok(void 0);
        } catch {
            return err("vault_repository_error");
        }
    }

    async listTags(): Promise<Result<VaultNodeTagInfoEntity[], VaultDomainError>> {
        try {
            const tags = await this.tagInfoRepository.findAll();
            return ok(tags);
        } catch {
            return err("vault_repository_error");
        }
    }

    async findNodesByTagId(tagId: string): Promise<Result<VaultNodeEntity[], VaultDomainError>> {
        try {
            const tag = await this.tagInfoRepository.findById(tagId);
            if (!tag) {
                return err("vault_tag_not_found");
            }

            const relations = await this.tagRepository.findByTagId(tagId);
            const nodes = await Promise.all(relations.map((rel) => this.nodeRepository.findById(rel.nodeId)));
            return ok(nodes.filter((n): n is VaultNodeEntity => n != null));
        } catch {
            return err("vault_repository_error");
        }
    }

    async findNodesByTagName(tagName: string): Promise<Result<VaultNodeEntity[], VaultDomainError>> {
        if (!tagName) {
            return err("vault_invalid_input");
        }

        try {
            const tag = await this.tagInfoRepository.findByName(tagName);
            if (!tag) {
                return err("vault_tag_not_found");
            }

            return this.findNodesByTagId(tag.id);
        } catch {
            return err("vault_repository_error");
        }
    }

    async removeTagFromNode(nodeId: string, tagId: string): Promise<Result<void, VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        try {
            await this.tagRepository.remove(nodeId, tagId);
        } catch {
            return err("vault_repository_error");
        }

        return ok(void 0);
    }

    async getTagsForNode(nodeId: string): Promise<Result<VaultNodeTagInfoEntity[], VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        try {
            const relations = await this.tagRepository.findByNodeId(nodeId);
            const tags = await Promise.all(relations.map((rel) => this.tagInfoRepository.findById(rel.tagId)));
            return ok(tags.filter((t): t is VaultNodeTagInfoEntity => t != null));
        } catch {
            return err("vault_repository_error");
        }
    }

    async getSourcesForNode(nodeId: string): Promise<Result<VaultNodeSourceEntity[], VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        try {
            const sources = await this.sourceRepository.findByNodeId(nodeId);
            return ok(sources);
        } catch {
            return err("vault_repository_error");
        }
    }

    async addSourceToNode(params: {
        nodeId: string;
        type: "external" | "internal";
        server: string | null;
        urlOrFileId: string;
    }): Promise<Result<VaultNodeSourceEntity, VaultDomainError>> {
        const { nodeId, type, server, urlOrFileId } = params;

        if (!urlOrFileId) {
            return err("vault_invalid_input");
        }

        const node = await this.nodeRepository.findById(nodeId);
        if (!node || node.type !== "file") {
            return err("vault_node_not_found");
        }

        if (type === "internal") {
            const file = await this.fileRepository.findById(urlOrFileId);
            if (!file) {
                return err("vault_file_not_found");
            }
        }

        const sourceId = this.idGenerator.generateUUID();
        const now = new Date();
        const source = new VaultNodeSourceEntity({
            id: sourceId,
            nodeId,
            type,
            server,
            url: urlOrFileId,
            createdAt: now,
        });

        try {
            await this.sourceRepository.save(source);
        } catch {
            return err("vault_repository_error");
        }

        return ok(source);
    }

    async updateSource(params: {
        sourceId: string;
        type?: "external" | "internal";
        server?: string | null;
        urlOrFileId?: string;
    }): Promise<Result<VaultNodeSourceEntity, VaultDomainError>> {
        const { sourceId, type, server, urlOrFileId } = params;

        const existing = await this.sourceRepository.findById(sourceId);
        if (!existing) {
            return err("vault_node_not_found");
        }

        let finalType = existing.type;
        let finalUrl = existing.url;
        let finalServer = existing.server;

        if (type !== undefined) {
            finalType = type;
        }
        if (server !== undefined) {
            finalServer = server;
        }
        if (urlOrFileId !== undefined) {
            if (!urlOrFileId) {
                return err("vault_invalid_input");
            }
            finalUrl = urlOrFileId;
        }

        if (finalType === "internal") {
            const file = await this.fileRepository.findById(finalUrl);
            if (!file) {
                return err("vault_file_not_found");
            }
        }

        const updated = new VaultNodeSourceEntity({
            id: existing.id,
            nodeId: existing.nodeId,
            type: finalType,
            server: finalServer,
            url: finalUrl,
            createdAt: existing.createdAt,
        });

        try {
            await this.sourceRepository.update(updated);
        } catch {
            return err("vault_repository_error");
        }

        return ok(updated);
    }

    async deleteSource(sourceId: string): Promise<Result<void, VaultDomainError>> {
        try {
            const existing = await this.sourceRepository.findById(sourceId);
            if (!existing) {
                return err("vault_node_not_found");
            }

            await this.sourceRepository.deleteById(sourceId);
        } catch {
            return err("vault_repository_error");
        }

        return ok(void 0);
    }

    async setThumbnail(
        nodeId: string,
        thumbnailFileId: string | null,
    ): Promise<Result<VaultNodeEntity, VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        if (thumbnailFileId !== null) {
            const file = await this.fileRepository.findById(thumbnailFileId);
            if (!file) {
                return err("vault_file_not_found");
            }
        }

        const updated = new VaultNodeEntity({
            id: node.id,
            parentId: node.parentId,
            name: node.name,
            type: node.type,
            createdAt: node.createdAt,
            thumbnailId: thumbnailFileId,
            isPublic: node.isPublic,
        });

        try {
            await this.nodeRepository.save(updated);
        } catch {
            return err("vault_repository_error");
        }

        return ok(updated);
    }

    async setNodePublic(nodeId: string, isPublic: boolean): Promise<Result<VaultNodeEntity, VaultDomainError>> {
        const node = await this.nodeRepository.findById(nodeId);
        if (!node) {
            return err("vault_node_not_found");
        }

        const updated = new VaultNodeEntity({
            id: node.id,
            parentId: node.parentId,
            name: node.name,
            type: node.type,
            createdAt: node.createdAt,
            thumbnailId: node.thumbnailId,
            isPublic,
        });

        try {
            await this.nodeRepository.save(updated);
        } catch {
            return err("vault_repository_error");
        }

        return ok(updated);
    }
}

