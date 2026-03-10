import { useState } from "preact/hooks";
import {
  user,
  logout,
  isRootDerived,
  isAdminDerived,
  canReadUsers,
  canActivateUsers,
  canDeactivateUsers,
  canManageFaqRead,
  canManageFaqCreate,
  canManageFaqUpdate,
  canManageFaqDelete,
  canManageFaqRestore,
  canManagePermissionsMeta,
  canManageUserPermissions,
  canManageFaqPermissions,
} from "@store/auth";
import { api, ApiError, t } from "@utils";
import { addToast } from "@store/toast";
import Layout from "@components/Layout";
import Button from "@components/Button";
import Input from "@components/Input";
import Badge from "@components/Badge";
import Modal from "@components/Modal";

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "Mínimo 8 caracteres" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Una letra mayúscula" },
  { test: (p: string) => /[a-z]/.test(p), label: "Una letra minúscula" },
  { test: (p: string) => /[0-9]/.test(p), label: "Un número" },
  { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), label: "Un símbolo" },
];

export default function Profile() {
  const u = user.value;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  if (!u) return <div />;

  const allValid = passwordRules.every((r) => r.test(password));
  const matches = password === confirm;

  const canManageUsersCaps =
    canReadUsers.value || canActivateUsers.value || canDeactivateUsers.value;
  const canManageFaqCaps =
    canManageFaqRead.value ||
    canManageFaqCreate.value ||
    canManageFaqUpdate.value ||
    canManageFaqDelete.value ||
    canManageFaqRestore.value;
  const canManagePermissionsCaps =
    canManagePermissionsMeta.value ||
    canManageUserPermissions.value ||
    canManageFaqPermissions.value;

  async function handleChangePassword(e: Event) {
    e.preventDefault();
    if (!allValid || !matches) return;
    setSaving(true);
    try {
      const res = await api.post<{ message: string }>("/update-password", { password });
      addToast(t(res.message), "success");
      setPassword("");
      setConfirm("");
    } catch (err) {
      addToast(err instanceof ApiError ? t(err.code) : t("unknown_error"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      const res = await api.post<{ message: string }>(`/user/deactivate/${u!.id}`);
      addToast(t(res.message), "info");
      await logout();
    } catch (err) {
      addToast(err instanceof ApiError ? t(err.code) : t("unknown_error"), "error");
    } finally {
      setDeactivating(false);
      setDeactivateOpen(false);
    }
  }

  return (
    <Layout>
      <h1 class="text-xl font-bold text-[var(--text-primary)] mb-6">Mi Perfil</h1>

      {/* User Info Card */}
      <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-14 w-14 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xl font-bold text-[var(--accent)]">
            {u.username[0].toUpperCase()}
          </div>
          <div>
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">{u.username}</h2>
            <p class="text-xs text-[var(--text-muted)]">Miembro desde {new Date(u.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            {isRootDerived.value && <Badge variant="root">Root</Badge>}
            {isAdminDerived.value && !isRootDerived.value && <Badge variant="admin">Admin</Badge>}
            <Badge variant={u.isActive ? "active" : "inactive"}>{u.isActive ? "Activo" : "Inactivo"}</Badge>
          </div>
          <ul class="text-xs text-[var(--text-muted)] space-y-1 mt-1">
            {canManageUsersCaps && <li>Puede gestionar usuarios</li>}
            {canManageFaqCaps && <li>Puede gestionar FAQ</li>}
            {canManagePermissionsCaps && <li>Puede gestionar permisos de otros usuarios</li>}
            {!canManageUsersCaps && !canManageFaqCaps && !canManagePermissionsCaps && (
              <li>No tiene permisos administrativos especiales</li>
            )}
          </ul>
        </div>
      </div>

      {/* Change Password */}
      <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 mb-6">
        <h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleChangePassword} class="flex flex-col gap-4 max-w-md">
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            placeholder="Nueva contraseña"
          />
          {password && (
            <div class="flex flex-col gap-1">
              {passwordRules.map((rule) => (
                <span
                  key={rule.label}
                  class={`text-xs ${rule.test(password) ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}
                >
                  {rule.test(password) ? "✓" : "○"} {rule.label}
                </span>
              ))}
            </div>
          )}
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onInput={(e) => setConfirm((e.target as HTMLInputElement).value)}
            placeholder="Repite la contraseña"
            error={confirm && !matches ? "Las contraseñas no coinciden" : undefined}
          />
          <Button type="submit" loading={saving} disabled={!allValid || !matches} class="self-start">
            Cambiar contraseña
          </Button>
        </form>
      </div>

      {/* Account Actions */}
      <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">Acciones de cuenta</h3>
        <div class="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => logout()}>Cerrar sesión</Button>
          <Button variant="warning" onClick={() => logout(true)}>Cerrar todas las sesiones</Button>
          <Button variant="danger" onClick={() => setDeactivateOpen(true)}>Desactivar cuenta</Button>
        </div>
      </div>

      {/* Deactivate Confirm */}
      <Modal open={deactivateOpen} onClose={() => setDeactivateOpen(false)} title="Desactivar cuenta">
        <p class="text-sm text-[var(--text-secondary)] mb-6">
          Esta acción desactivará tu cuenta. No podrás iniciar sesión hasta que un administrador la reactive. ¿Continuar?
        </p>
        <div class="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeactivateOpen(false)}>Cancelar</Button>
          <Button variant="danger" loading={deactivating} onClick={handleDeactivate}>Desactivar</Button>
        </div>
      </Modal>
    </Layout>
  );
}
