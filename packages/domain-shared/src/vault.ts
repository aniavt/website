export const VAULT_NODE_TYPES = ["file", "folder"] as const;
export type VaultNodeType = (typeof VAULT_NODE_TYPES)[number];

export const VAULT_SOURCE_TYPES = ["external", "internal"] as const;
export type VaultSourceType = (typeof VAULT_SOURCE_TYPES)[number];
