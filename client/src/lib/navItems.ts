import type { NavItemsDto } from "@ania/api-contract/nav-items";
import { throwApiError } from "@ania/api-contract/error";
import { buildApiUrl } from "./buildApiUrl";
import { slugify } from "./slugify";

export async function listNavItems(): Promise<NavItemsDto[]> {
  const res = await fetch(buildApiUrl("/navItems?activeOnly=true"));
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function getNavItemsBySlug(slug: string): Promise<NavItemsDto | null> {
  const all = await listNavItems();
  return all.find((a) => slugify(a.title) === slug) ?? null;
}

export async function getNavItems(id: string): Promise<NavItemsDto | null> {
  const res = await fetch(buildApiUrl(`/navItems/${id}`));
  if (res.status === 404) return null;
  if (!res.ok) await throwApiError(res);
  return res.json();
}
