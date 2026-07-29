export type VaultNodeType = "file" | "folder";

export type VaultSourceType = "external" | "internal";

export interface VaultNodeDto {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly type: VaultNodeType;
  readonly createdAt: string | null;
  readonly thumbnailId: string | null;
  readonly isPublic: boolean;
}

export interface VaultTagDto {
  readonly id: string;
  readonly name: string;
}

export interface VaultNodeSourceDto {
  readonly id: string;
  readonly nodeId: string;
  readonly type: VaultSourceType;
  readonly server: string | null;
  readonly url: string;
  readonly createdAt: string;
}

export interface CreateVaultFolderInput {
  parentId: string | null;
  name: string;
  isPublic?: boolean;
}

/** JSON body for creating a file node (multipart may omit urlOrFileId). */
export interface CreateVaultFileNodeInput {
  parentId: string | null;
  name: string;
  sourceType: VaultSourceType;
  server: string | null;
  urlOrFileId?: string;
  isPublic?: boolean;
}

export interface MoveVaultNodeInput {
  nodeId: string;
  newParentId: string | null;
}

export interface RenameVaultNodeInput {
  nodeId: string;
  newName: string;
}

export interface SetVaultNodePublicInput {
  nodeId: string;
  isPublic: boolean;
}

export interface SetVaultThumbnailInput {
  nodeId: string;
  thumbnailFileId: string | null;
}

export interface CreateVaultTagInput {
  name: string;
}

export interface RenameVaultTagInput {
  name: string;
}

export interface AddVaultSourceToNodeInput {
  type: VaultSourceType;
  server: string | null;
  urlOrFileId?: string;
}

export interface UpdateVaultSourceInput {
  type?: VaultSourceType;
  server?: string | null;
  urlOrFileId?: string;
}
