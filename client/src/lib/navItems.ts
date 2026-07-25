export interface NavItemsDto {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly position: number;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUrl(path: string) {
  const PUBLIC_API = import.meta.env.PUBLIC_SERVER_URL || '/api';
  const SERVER_API = import.meta.env.SERVER_URL || 'http://server:3000';
  const base = import.meta.env.SSR ? SERVER_API : PUBLIC_API;
  return `${base}${path}`;
}

export async function listNavItems(): Promise<NavItemsDto[]> {
  const res = await fetch(buildUrl("/navItems?activeOnly=true"));
  if (!res.ok) throw new Error("navItems_list_failed");
  return res.json();
}

export async function getNavItemsBySlug(slug: string): Promise<NavItemsDto | null> {
  const all = await listNavItems();
  return all.find((a) => slugify(a.title) === slug) ?? null;
}

export async function getNavItems(id: string): Promise<NavItemsDto | null> {
  const res = await fetch(buildUrl(`/navItems/${id}`));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("navItems_get_failed");
  return res.json();
}