// TypeScript - client/src/lib/vault/api.ts
// Funciones de solo lectura para consumir el Vault desde el cliente (hemeroteca).

import type { VaultNodeDto, VaultTagDto, VaultNodeSourceDto } from "./types";

function buildApiUrl(path: string): string {
  if (typeof window === "undefined") {
    const g =
      typeof globalThis !== "undefined"
        ? (globalThis as { process?: { env?: Record<string, string> } })
        : null;
    const envUrl = g?.process?.env?.PUBLIC_SERVER_URL;
    const base = envUrl || import.meta.env.PUBLIC_SERVER_URL || "";
    return `${base.replace(/\/+$/, "")}${g === null ? "/api" : ""}${path}`;
  }

  return `/api${path}`;
}

async function getJson<T>(path: string): Promise<T> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    const err = new Error(data.error ?? "unknown_error");
    // @ts-expect-error attach status for callers if needed
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export async function fetchVaultChildren(
  parentId: string | null,
): Promise<VaultNodeDto[]> {
  const params = new URLSearchParams();
  if (parentId !== null) params.set("parentId", parentId);
  const query = params.toString();
  const path = `/vault/children${query ? `?${query}` : ""}`;
  return getJson<VaultNodeDto[]>(path);
}

export async function fetchVaultNodeByParentAndName(
  parentId: string | null,
  name: string,
): Promise<VaultNodeDto | null> {
  const params = new URLSearchParams();
  if (parentId !== null) params.set("parentId", parentId);
  params.set("name", name);
  const path = `/vault/node-by-name?${params.toString()}`;
  return getJson<VaultNodeDto | null>(path);
}

export async function fetchVaultTags(): Promise<VaultTagDto[]> {
  return getJson<VaultTagDto[]>("/vault/tags");
}

export async function fetchVaultTagsForNode(
  nodeId: string,
): Promise<VaultTagDto[]> {
  return getJson<VaultTagDto[]>(`/vault/node/${nodeId}/tags`);
}

export async function fetchVaultSourcesForNode(
  nodeId: string,
): Promise<VaultNodeSourceDto[]> {
  return getJson<VaultNodeSourceDto[]>(`/vault/node/${nodeId}/sources`);
}

export async function fetchVaultNodesByTagId(
  tagId: string,
): Promise<VaultNodeDto[]> {
  const params = new URLSearchParams();
  params.set("tagId", tagId);
  const path = `/vault/nodes?${params.toString()}`;
  return getJson<VaultNodeDto[]>(path);
}

export async function fetchVaultNodesByTagName(
  tagName: string,
): Promise<VaultNodeDto[]> {
  const params = new URLSearchParams();
  params.set("tagName", tagName);
  const path = `/vault/nodes?${params.toString()}`;
  return getJson<VaultNodeDto[]>(path);
}

