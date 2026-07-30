export const PERMISSION_NAMESPACES = [
  "meta",
  "user",
  "faq",
  "weekly_schedule",
  "anime",
  "navItems",
] as const;

export type PermissionNamespace = (typeof PERMISSION_NAMESPACES)[number];

export const PERMISSION_SLUGS = {
  meta: [
    "meta_manage_permissions",
    "manage_user",
    "manage_faq",
    "manage_weekly_schedule",
    "manage_anime",
    "manage_navItems",
  ],
  user: ["read_user", "activate_user", "deactivate_user"],
  faq: ["read_faq", "create_faq", "delete_faq", "update_faq", "restore_faq"],
  weekly_schedule: [
    "create_weekly_schedule",
    "delete_weekly_schedule",
    "update_weekly_schedule",
    "read_weekly_schedule_history",
  ],
  anime: ["read_anime", "create_anime", "delete_anime", "update_anime", "restore_anime"],
  navItems: [
    "read_navItems",
    "create_navItems",
    "delete_navItems",
    "update_navItems",
    "restore_navItems",
  ],
} as const satisfies Record<PermissionNamespace, readonly string[]>;

export type PermissionSlug<N extends PermissionNamespace> =
  (typeof PERMISSION_SLUGS)[N][number];

export type NamespacedPermissionSlug<N extends PermissionNamespace = PermissionNamespace> = {
  [K in N]: `${K}.${PermissionSlug<K>}`;
}[N];

export interface UserPermissions {
  readonly meta: readonly NamespacedPermissionSlug<"meta">[];
  readonly user: readonly NamespacedPermissionSlug<"user">[];
  readonly faq: readonly NamespacedPermissionSlug<"faq">[];
  readonly weekly_schedule: readonly NamespacedPermissionSlug<"weekly_schedule">[];
  readonly anime: readonly NamespacedPermissionSlug<"anime">[];
  readonly navItems: readonly NamespacedPermissionSlug<"navItems">[];
}
