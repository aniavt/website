import { useState, useEffect, useCallback } from "preact/hooks";
import { api, ApiError, t } from "@utils";
import { addToast } from "@store/toast";
import {
  user as currentUser,
  canActivateUsers,
  canDeactivateUsers,
  canManagePermissionsMeta,
  canManageUserPermissions,
  canManageFaqPermissions,
  canManageWeeklySchedulePermissions,
  canManageVaultNodes,
  userHasPermission,
  type UserPermissions,
} from "@store/auth";
import Layout from "@components/Layout";
import Table, { type Column } from "@components/Table";
import Button from "@components/Button";
import Badge from "@components/Badge";
import Pagination from "@components/Pagination";
import Modal from "@components/Modal";

import type { User } from "@store/auth";

const LIMIT = 15;

type SortField = "username" | "createdAt" | "updatedAt";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [filterActive, setFilterActive] = useState<string>("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; fn: () => Promise<void> } | null>(null);

  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(offset),
        sort,
        sortBy,
      });
      if (filterActive) params.set("isActive", filterActive);

      const data = await api.get<User[]>(`/users?${params}`);
      setUsers(data);
      // The API doesn't return total count — estimate from response
      setTotal(data.length < LIMIT ? offset + data.length : offset + LIMIT + 1);
    } catch {
      addToast("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, sort, sortBy, filterActive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function askConfirm(label: string, fn: () => Promise<void>) {
    setConfirmAction({ label, fn });
    setConfirmOpen(true);
  }

  async function runConfirm() {
    if (!confirmAction) return;
    try {
      await confirmAction.fn();
      fetchUsers();
    } catch (err) {
      addToast(err instanceof ApiError ? t(err.code) : t("unknown_error"), "error");
    } finally {
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  }

  const canManageAnyPermissions =
    canManagePermissionsMeta.value ||
    canManageUserPermissions.value ||
    canManageFaqPermissions.value ||
    canManageWeeklySchedulePermissions.value ||
    canManageVaultNodes.value;

  async function openPermissions(u: User) {
    if (!canManageAnyPermissions) return;
    setPermissionsUser(u);
    setPermissionsOpen(true);
    setPermissionsLoading(true);
    try {
      const res = await api.get<{ permissions: UserPermissions }>(`/user/${u.id}/permissions`);
      setPermissions(res.permissions);
    } catch (err) {
      setPermissionsOpen(false);
      addToast(err instanceof ApiError ? t(err.code) : t("unknown_error"), "error");
    } finally {
      setPermissionsLoading(false);
    }
  }

  async function togglePermission(
    namespace: keyof UserPermissions,
    permission: string,
    enabled: boolean,
  ) {
    if (!permissionsUser || !permissions) return;
    const path = `/user/${permissionsUser.id}/permissions/${enabled ? "grant" : "revoke"}`;
    try {
      await api.post<{ message: string }>(path, { namespace, permission });
      const full = `${namespace}.${permission}`;
      setPermissions((prev) => {
        if (!prev) return prev;
        const current = prev[namespace] ?? [];
        const next = enabled
          ? current.includes(full)
            ? current
            : [...current, full]
          : current.filter((p) => p !== full);
        return { ...prev, [namespace]: next };
      });
      addToast(t(enabled ? "permission_granted" : "permission_revoked"), "success");
    } catch (err) {
      addToast(err instanceof ApiError ? t(err.code) : t("unknown_error"), "error");
    }
  }

  const metaPermissionsConfig: { slug: string; label: string; required?: boolean }[] = [
    { slug: "meta_manage_permissions", label: "Gestionar permisos meta" },
    { slug: "manage_user", label: "Gestionar permisos de usuarios" },
    { slug: "manage_faq", label: "Gestionar permisos de FAQ" },
    { slug: "manage_weekly_schedule", label: "Gestionar permisos de horario semanal" },
  ];

  const userPermissionsConfig: { slug: string; label: string }[] = [
    { slug: "read_user", label: "Ver usuarios" },
    { slug: "activate_user", label: "Activar usuarios" },
    { slug: "deactivate_user", label: "Desactivar usuarios" },
  ];

  const faqPermissionsConfig: { slug: string; label: string }[] = [
    { slug: "read_faq", label: "Ver FAQ" },
    { slug: "create_faq", label: "Crear FAQ" },
    { slug: "update_faq", label: "Editar FAQ" },
    { slug: "delete_faq", label: "Eliminar FAQ" },
    { slug: "restore_faq", label: "Restaurar FAQ" },
  ];

  const weeklySchedulePermissionsConfig: { slug: string; label: string }[] = [
    { slug: "create_weekly_schedule", label: "Crear horario semanal" },
    { slug: "update_weekly_schedule", label: "Editar horario semanal" },
    { slug: "delete_weekly_schedule", label: "Eliminar horario semanal" },
    {
      slug: "read_weekly_schedule_history",
      label: "Ver historial de horario semanal",
    },
  ];

  const vaultPermissionsConfig: { slug: string; label: string }[] = [
    { slug: "create_node", label: "Crear nodos" },
    { slug: "update_node", label: "Actualizar nodos" },
    { slug: "delete_node", label: "Eliminar nodos" },
  ];

  function userActions(u: User) {
    const isSelf = u.id === currentUser.value?.id;
    const canActivate = canActivateUsers.value && !isSelf;
    const canDeactivate = canDeactivateUsers.value || isSelf;

    if (!canActivate && !canDeactivate && !canManageAnyPermissions) return null;

    return (
      <div class="flex gap-2 flex-wrap">
        {u.isActive && canDeactivate && (
          <Button
            variant="danger"
            onClick={() =>
              askConfirm(
                `Desactivar a ${u.username}`,
                () =>
                  api
                    .post<{ message: string }>(`/user/deactivate/${u.id}`)
                    .then((r) => addToast(t(r.message), "success")),
              )
            }
          >
            Desactivar
          </Button>
        )}
        {!u.isActive && canActivate && (
          <Button
            variant="success"
            onClick={() =>
              askConfirm(
                `Activar a ${u.username}`,
                () =>
                  api
                    .post<{ message: string }>(`/user/activate/${u.id}`)
                    .then((r) => addToast(t(r.message), "success")),
              )
            }
          >
            Activar
          </Button>
        )}
        {canManageAnyPermissions && (
          <Button variant="ghost" onClick={() => openPermissions(u)}>
            Permisos
          </Button>
        )}
      </div>
    );
  }

  const columns: Column<User>[] = [
    {
      key: "username",
      header: "Usuario",
      render: (u) => <span class="font-medium text-[var(--text-primary)]">{u.username}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (u) => (
        <Badge variant={u.isActive ? "active" : "inactive"}>
          {u.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
      class: "w-24",
    },
    {
      key: "roles",
      header: "Roles",
      render: (u) => {
        const managesUsers =
          userHasPermission(u, "user", "read_user") ||
          userHasPermission(u, "user", "activate_user") ||
          userHasPermission(u, "user", "deactivate_user");
        const managesFaq =
          userHasPermission(u, "faq", "read_faq") ||
          userHasPermission(u, "faq", "create_faq") ||
          userHasPermission(u, "faq", "update_faq") ||
          userHasPermission(u, "faq", "delete_faq") ||
          userHasPermission(u, "faq", "restore_faq");
        const managesPermissions =
          userHasPermission(u, "meta", "meta_manage_permissions") ||
          userHasPermission(u, "meta", "manage_user") ||
          userHasPermission(u, "meta", "manage_faq") ||
          userHasPermission(u, "meta", "manage_weekly_schedule") ||
          userHasPermission(u, "meta", "manage_vault");
        const managesVault =
          userHasPermission(u, "vault", "create_node") ||
          userHasPermission(u, "vault", "update_node") ||
          userHasPermission(u, "vault", "delete_node");

        if (!managesUsers && !managesFaq && !managesPermissions && !managesVault) {
          return <span class="text-xs text-[var(--text-muted)]">—</span>;
        }

        return (
          <div class="flex gap-1.5 flex-wrap">
            {managesUsers && <Badge variant="admin">Usuarios</Badge>}
            {managesFaq && <Badge variant="admin">FAQ</Badge>}
            {managesPermissions && <Badge variant="root">Permisos</Badge>}
            {managesVault && <Badge variant="admin">Vault</Badge>}
          </div>
        );
      },
      class: "w-32",
    },
    {
      key: "createdAt",
      header: "Creado",
      render: (u) => <span class="text-xs text-[var(--text-muted)]">{new Date(u.createdAt).toLocaleDateString()}</span>,
      class: "w-28",
    },
    {
      key: "actions",
      header: "Acciones",
      render: (u) => userActions(u) ?? <span class="text-xs text-[var(--text-muted)]">—</span>,
    },
  ];

  const sortFields: { value: SortField; label: string }[] = [
    { value: "createdAt", label: "Fecha creación" },
    { value: "updatedAt", label: "Última actualización" },
    { value: "username", label: "Nombre" },
  ];

  return (
    <Layout>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">Usuarios</h1>
          <p class="text-sm text-[var(--text-muted)] mt-0.5">Administra los usuarios del sistema</p>
        </div>
      </div>

      {/* Filters */}
      <div class="flex flex-wrap gap-3 mb-4">
        <select
          class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
          value={sortBy}
          onChange={(e) => { setSortBy((e.target as HTMLSelectElement).value as SortField); setOffset(0); }}
        >
          {sortFields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <Button variant="ghost" onClick={() => { setSort(sort === "asc" ? "desc" : "asc"); setOffset(0); }}>
          {sort === "asc" ? "↑ Asc" : "↓ Desc"}
        </Button>
        <select
          class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
          value={filterActive}
          onChange={(e) => { setFilterActive((e.target as HTMLSelectElement).value); setOffset(0); }}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {loading ? (
        <p class="text-[var(--text-muted)] py-12 text-center">Cargando...</p>
      ) : (
        <>
          <Table columns={columns} data={users} keyFn={(u) => u.id} emptyMessage="No hay usuarios" />
          <Pagination offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
        </>
      )}

      {/* Confirm Modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar acción">
        <p class="text-sm text-[var(--text-secondary)] mb-6">
          ¿Estás seguro de que deseas <strong>{confirmAction?.label}</strong>?
        </p>
        <div class="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={runConfirm}>Confirmar</Button>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        title={permissionsUser ? `Permisos de ${permissionsUser.username}` : "Permisos"}
      >
        {permissionsLoading || !permissions ? (
          <p class="text-[var(--text-muted)] text-center py-4">Cargando permisos...</p>
        ) : (
          <div class="flex flex-col gap-4">
            <div>
              <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-2">Meta</h3>
              <div class="flex flex-col gap-1">
                {metaPermissionsConfig.map((p) => {
                  const full = `meta.${p.slug}`;
                  const checked = permissions.meta.includes(full);
                  const canEdit = canManagePermissionsMeta.value;
                  return (
                    <label key={p.slug} class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEdit}
                        onChange={(e) =>
                          togglePermission("meta", p.slug, (e.target as HTMLInputElement).checked)
                        }
                      />
                      <span>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-2">Usuarios</h3>
              <div class="flex flex-col gap-1">
                {userPermissionsConfig.map((p) => {
                  const full = `user.${p.slug}`;
                  const checked = permissions.user.includes(full);
                  const canEdit = canManageUserPermissions.value;
                  return (
                    <label key={p.slug} class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEdit}
                        onChange={(e) =>
                          togglePermission("user", p.slug, (e.target as HTMLInputElement).checked)
                        }
                      />
                      <span>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-2">FAQ</h3>
              <div class="flex flex-col gap-1">
                {faqPermissionsConfig.map((p) => {
                  const full = `faq.${p.slug}`;
                  const checked = permissions.faq.includes(full);
                  const canEdit = canManageFaqPermissions.value;
                  return (
                    <label key={p.slug} class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEdit}
                        onChange={(e) =>
                          togglePermission("faq", p.slug, (e.target as HTMLInputElement).checked)
                        }
                      />
                      <span>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Horario semanal
              </h3>
              <div class="flex flex-col gap-1">
                {weeklySchedulePermissionsConfig.map((p) => {
                  const full = `weekly_schedule.${p.slug}`;
                  const checked = permissions.weekly_schedule.includes(full);
                  const canEdit = canManageUserPermissions.value;
                  return (
                    <label
                      key={p.slug}
                      class="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEdit}
                        onChange={(e) =>
                          togglePermission(
                            "weekly_schedule",
                            p.slug,
                            (e.target as HTMLInputElement).checked,
                          )
                        }
                      />
                      <span>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-2">Bodega</h3>
              <div class="flex flex-col gap-1">
                {vaultPermissionsConfig.map((p) => {
                  const full = `vault.${p.slug}`;
                  const checked = permissions.vault.includes(full);
                  const canEdit = canManageVaultNodes.value;
                  return (
                    <label
                      key={p.slug}
                      class="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEdit}
                        onChange={(e) =>
                          togglePermission(
                            "vault",
                            p.slug,
                            (e.target as HTMLInputElement).checked,
                          )
                        }
                      />
                      <span>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
