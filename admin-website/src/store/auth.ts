import { signal, computed } from "@preact/signals";
import { api } from "@utils";
import { route } from "preact-router";

export type PermissionNamespace = "meta" | "user" | "faq" | "weekly_schedule";

export interface UserPermissions {
  readonly meta: string[];
  readonly user: string[];
  readonly faq: string[];
  readonly weekly_schedule: string[];
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  sessionVersion: number;
  permissions: UserPermissions;
}

export const user = signal<User | null>(null);
export const authLoading = signal(true);
export const isAuthenticated = computed(() => user.value !== null);

export function userHasPermission(
  target: User | null | undefined,
  namespace: PermissionNamespace,
  permission: string,
): boolean {
  if (!target) return false;
  const full = `${namespace}.${permission}`;
  return target.permissions[namespace]?.includes(full) ?? false;
}

export function hasPermission(namespace: PermissionNamespace, permission: string): boolean {
  return userHasPermission(user.value, namespace, permission);
}

export const canReadUsers = computed(() => hasPermission("user", "read_user"));
export const canActivateUsers = computed(() => hasPermission("user", "activate_user"));
export const canDeactivateUsers = computed(() => hasPermission("user", "deactivate_user"));

export const canManageFaqRead = computed(() => hasPermission("faq", "read_faq"));
export const canManageFaqCreate = computed(() => hasPermission("faq", "create_faq"));
export const canManageFaqUpdate = computed(() => hasPermission("faq", "update_faq"));
export const canManageFaqDelete = computed(() => hasPermission("faq", "delete_faq"));
export const canManageFaqRestore = computed(() => hasPermission("faq", "restore_faq"));

export const canReadWeeklySchedule = computed(() =>
  hasPermission("weekly_schedule", "create_weekly_schedule") ||
  hasPermission("weekly_schedule", "update_weekly_schedule") ||
  hasPermission("weekly_schedule", "delete_weekly_schedule") ||
  hasPermission("weekly_schedule", "read_weekly_schedule_history"),
);
export const canCreateWeeklySchedule = computed(() =>
  hasPermission("weekly_schedule", "create_weekly_schedule"),
);
export const canUpdateWeeklySchedule = computed(() =>
  hasPermission("weekly_schedule", "update_weekly_schedule"),
);
export const canDeleteWeeklySchedule = computed(() =>
  hasPermission("weekly_schedule", "delete_weekly_schedule"),
);
export const canViewWeeklyScheduleHistory = computed(() =>
  hasPermission("weekly_schedule", "read_weekly_schedule_history"),
);

export const canManagePermissionsMeta = computed(() => hasPermission("meta", "meta_manage_permissions"));
export const canManageUserPermissions = computed(() => hasPermission("meta", "manage_user"));
export const canManageFaqPermissions = computed(() => hasPermission("meta", "manage_faq"));
export const canManageWeeklySchedulePermissions = computed(() =>
  hasPermission("meta", "manage_weekly_schedule"),
);

export const isRootDerived = computed(
  () =>
    canManagePermissionsMeta.value &&
    canManageUserPermissions.value &&
    canManageFaqPermissions.value &&
    canReadUsers.value &&
    canManageFaqRead.value,
);

export const isAdminDerived = computed(
  () =>
    !isRootDerived.value &&
    (canReadUsers.value ||
      canManageFaqRead.value ||
      canActivateUsers.value ||
      canDeactivateUsers.value ||
      canManageFaqCreate.value ||
      canManageFaqUpdate.value ||
      canManageFaqDelete.value ||
      canManageFaqRestore.value),
);

export async function checkAuth() {
  authLoading.value = true;
  try {
    user.value = await api.get<User>("/me");
  } catch {
    user.value = null;
  } finally {
    authLoading.value = false;
  }
}

export async function login(username: string, password: string) {
  user.value = await api.post<User>("/login", { username, password });
  route("/admin/faq");
}

export async function logout(all = false) {
  try {
    await api.post(`/logout${all ? "?all=true" : ""}`);
  } finally {
    user.value = null;
    route("/admin");
  }
}
