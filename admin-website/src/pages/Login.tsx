import { useState, useEffect } from "preact/hooks";
import { login, isAuthenticated, user } from "@store/auth";
import { ApiError, t } from "@utils";
import Button from "@components/Button";
import Input from "@components/Input";
import ToastContainer from "@components/Toast";
import { addToast } from "@store/toast";
import { route } from "preact-router";

const REDIRECT_SECONDS = 3;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const alreadyLoggedIn = isAuthenticated.value;

  useEffect(() => {
    if (!alreadyLoggedIn) return;
    if (countdown <= 0) {
      route("/admin/profile");
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [alreadyLoggedIn, countdown]);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      addToast("Sesión iniciada", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? t(err.code) : t("unknown_error");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (alreadyLoggedIn) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div class="w-full max-w-sm text-center">
          <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 shadow-2xl">
            <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xl font-bold text-[var(--accent)]">
              {user.value?.username[0].toUpperCase()}
            </div>
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">Ya has iniciado sesión</h2>
            <p class="mt-1 text-sm text-[var(--text-muted)]">
              Hola, <span class="text-[var(--text-secondary)] font-medium">{user.value?.username}</span>
            </p>
            <div class="mt-6 flex flex-col items-center gap-3">
              <div class="relative h-14 w-14">
                <svg class="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-subtle)" stroke-width="4" />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="var(--accent)"
                    stroke-width="4"
                    stroke-dasharray={`${(1 - countdown / REDIRECT_SECONDS) * 125.6} 125.6`}
                    stroke-linecap="round"
                  />
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-xl font-bold text-[var(--accent)]">
                  {countdown}
                </span>
              </div>
              <p class="text-xs text-[var(--text-muted)]">Redirigiendo a tu perfil...</p>
            </div>
            <Button variant="ghost" class="mt-4 w-full" onClick={() => route("/admin/profile")}>
              Ir ahora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <ToastContainer />
      <div class="w-full max-w-sm">
        <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 shadow-2xl">
          <div class="mb-8 text-center">
            <h1 class="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Ania Admin</h1>
            <p class="text-sm text-[var(--text-muted)] mt-1">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} class="flex flex-col gap-4">
            <Input
              label="Usuario"
              placeholder="Tu nombre de usuario"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              autoFocus
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            />

            {error && (
              <div class="rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} class="w-full mt-2">
              Iniciar sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
