import type { VaultDomainError } from "@domain/services/VaultService";

export type VaultError =
    | VaultDomainError
    | "vault_not_authorized";

