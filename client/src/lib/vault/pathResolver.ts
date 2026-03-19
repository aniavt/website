// TypeScript - client/src/lib/vault/pathResolver.ts
// Helper para resolver una ruta lógica de la bóveda a partir de segmentos.

import type { VaultNodeDto } from "./types";
import { fetchVaultNodeByParentAndName } from "./api";

export interface ResolvedVaultPath {
  node: VaultNodeDto | null;
  trail: VaultNodeDto[];
}

export async function resolveVaultPath(segments: string[]): Promise<ResolvedVaultPath> {
  if (segments.length === 0) {
    return { node: null, trail: [] };
  }

  const trail: VaultNodeDto[] = [];
  let parentId: string | null = null;
  let current: VaultNodeDto | null = null;

  for (const raw of segments) {
    const name = decodeURIComponent(raw);
    const found = await fetchVaultNodeByParentAndName(parentId, name);
    if (!found) {
      return { node: null, trail };
    }
    trail.push(found);
    current = found;
    parentId = found.id;
  }

  return { node: current, trail };
}

