import "./App.css";
import { Router, Route } from "preact-router";
import { useEffect } from "preact/hooks";
import {
  checkAuth,
  authLoading,
  isAuthenticated,
  hasPermission,
  type PermissionNamespace,
} from "@store/auth";
import Login from "@pages/Login";
import Faq from "@pages/Faq";
import Users from "@pages/Users";
import Profile from "@pages/Profile";
import WeeklySchedule from "@pages/WeeklySchedule";
import Vault from "@pages/Vault";

// Show vite.config.ts base path
const basePath = (path: string) => `/admin${path === "/" ? "" : path}`;

interface GuardProps {
  component: () => preact.JSX.Element;
  path?: string;
}

interface PermissionRequirement {
  namespace: PermissionNamespace;
  permission: string;
}

interface PermissionGuardProps extends GuardProps {
  required?: PermissionRequirement[];
}

function AuthGuard({ component: Component }: GuardProps) {
  if (!isAuthenticated.value) {
    if (typeof window !== "undefined") window.location.replace("/admin");
    return <div />;
  }
  return <Component />;
}

function PermissionGuard({ component: Component, required }: PermissionGuardProps) {
  if (!isAuthenticated.value) {
    if (typeof window !== "undefined") window.location.replace("/admin");
    return <div />;
  }

  const hasAllPermissions =
    !required || required.every((r) => hasPermission(r.namespace, r.permission));

  if (!hasAllPermissions) {
    if (typeof window !== "undefined") window.location.replace("/admin/profile");
    return <div />;
  }

  return <Component />;
}

export default function App() {
  useEffect(() => { checkAuth(); }, []);

  if (authLoading.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <span class="text-[var(--text-muted)] text-sm">Cargando...</span>
      </div>
    );
  }

  return (
    <Router>
      <Route path={basePath("/")} component={Login} />
      <Route
        path={basePath("/faq")}
        component={() => (
          <PermissionGuard
            component={Faq}
            required={[{ namespace: "faq", permission: "read_faq" }]}
          />
        )}
      />
      <Route
        path={basePath("/users")}
        component={() => (
          <PermissionGuard
            component={Users}
            required={[{ namespace: "user", permission: "read_user" }]}
          />
        )}
      />
      <Route
        path={basePath("/weekly-schedule")}
        component={() => (
          <PermissionGuard
            component={WeeklySchedule}
            required={[
              {
                namespace: "weekly_schedule",
                permission: "read_weekly_schedule_history",
              },
            ]}
          />
        )}
      />
      <Route
        path={basePath("/vault")}
        component={() => (
          <PermissionGuard
            component={Vault}
            required={[{ namespace: "vault", permission: "create_node" }]}
          />
        )}
      />
      <Route path={basePath("/profile")} component={() => <AuthGuard component={Profile} />} />
    </Router>
  );
}
