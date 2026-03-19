// TypeScript - client/src/lib/vault/types.ts
// Tipos públicos de Vault reutilizables en el cliente (hemeroteca).

export type VaultNodeType = "file" | "folder";

export interface VaultNodeDto {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly type: VaultNodeType;
  readonly createdAt: string;
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
  readonly type: "external" | "internal";
  readonly server: string | null;
  readonly url: string;
  readonly createdAt: string;
}

