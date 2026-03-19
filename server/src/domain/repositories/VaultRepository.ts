import type {
    VaultNodeEntity,
    VaultNodeSourceEntity,
    VaultNodeTagEntity,
    VaultNodeTagInfoEntity,
} from "@domain/entities/Vault";


export interface VaultNodeRepository {
    save(node: VaultNodeEntity): Promise<void>;
    findById(id: string): Promise<VaultNodeEntity | null>;
    findByParentAndName(parentId: string | null, name: string): Promise<VaultNodeEntity | null>;
    findChildren(parentId: string | null): Promise<VaultNodeEntity[]>;
    delete(id: string): Promise<void>;
}

export interface VaultNodeSourceRepository {
    save(source: VaultNodeSourceEntity): Promise<void>;
    findById(id: string): Promise<VaultNodeSourceEntity | null>;
    findByNodeId(nodeId: string): Promise<VaultNodeSourceEntity[]>;
    update(source: VaultNodeSourceEntity): Promise<void>;
    deleteById(id: string): Promise<void>;
    deleteByNodeId(nodeId: string): Promise<void>;
}

export interface VaultNodeTagInfoRepository {
    save(tag: VaultNodeTagInfoEntity): Promise<void>;
    findById(id: string): Promise<VaultNodeTagInfoEntity | null>;
    findAll(): Promise<VaultNodeTagInfoEntity[]>;
    findByName(name: string): Promise<VaultNodeTagInfoEntity | null>;
    deleteById(id: string): Promise<void>;
}

export interface VaultNodeTagRepository {
    add(tag: VaultNodeTagEntity): Promise<void>;
    remove(nodeId: string, tagId: string): Promise<void>;
    findByNodeId(nodeId: string): Promise<VaultNodeTagEntity[]>;
    findByTagId(tagId: string): Promise<VaultNodeTagEntity[]>;
    deleteByTagId(tagId: string): Promise<void>;
}

