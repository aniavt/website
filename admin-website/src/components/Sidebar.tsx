import {
  user,
  logout,
  canReadUsers,
  canManageFaqRead,
  canReadWeeklySchedule,
  canReadVault,
  canReadAnime,
} from "@store/auth";

interface NavItem {
  label: string;
  href: string;
  visible: boolean;
}

export default function Sidebar() {
  const items: NavItem[] = [
    { label: "FAQ", href: "/admin/faq", visible: canManageFaqRead.value },
    {
      label: "Horario semanal",
      href: "/admin/weekly-schedule",
      visible: canReadWeeklySchedule.value,
    },
    { label: "Bodega", href: "/admin/vault", visible: canReadVault.value },
    { label: "Anime", href: "/admin/anime", visible: canReadAnime.value },
    { label: "Usuarios", href: "/admin/users", visible: canReadUsers.value },
    { label: "Perfil", href: "/admin/profile", visible: true },
  ];

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <aside class="fixed top-0 left-0 h-screen w-60 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] z-30">
      <div class="px-6 py-5 border-b border-[var(--border-subtle)]">
        <h1 class="text-lg font-bold text-[var(--text-primary)] tracking-tight">Ania Admin</h1>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">@{user.value?.username}</p>
      </div>

      <nav class="flex-1 flex flex-col gap-1 p-3">
        {items.filter((i) => i.visible).map((item) => {
          const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
          return (
            <a
              key={item.href}
              href={item.href}
              class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"}`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div class="p-3 border-t border-[var(--border-subtle)]">
        <button
          onClick={() => logout()}
          class="w-full px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--error)] transition-colors text-left cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
