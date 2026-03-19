import type { ComponentChildren } from "preact";
import Button from "@components/Button";
import type { VaultNodeDto } from "@utils";

interface VaultTreeProps {
  nodes: VaultNodeDto[];
  selectedId: string | null;
  onSelect: (node: VaultNodeDto | null) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onCreateFile?: (parentId: string | null) => void;
}

interface TreeNodeProps {
  node: VaultNodeDto;
  depth: number;
  isSelected: boolean;
  children: VaultNodeDto[];
  onSelect: (node: VaultNodeDto) => void;
}

function NodeIcon({ type }: { type: VaultNodeDto["type"] }) {
  if (type === "folder") {
    return (
      <span class="inline-flex h-5 w-5 items-center justify-center rounded bg-[var(--bg-tertiary)] text-[var(--accent)] mr-2">
        📁
      </span>
    );
  }

  return (
    <span class="inline-flex h-5 w-5 items-center justify-center rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] mr-2">
      📄
    </span>
  );
}

function TreeNode({ node, depth, isSelected, children, onSelect }: TreeNodeProps) {
  const isFolder = node.type === "folder";

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node)}
        class={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
          isSelected
            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <span class="flex items-center min-w-0">
          <NodeIcon type={node.type} />
          <span class="truncate">{node.name}</span>
        </span>
        {isFolder && (
          <span class="text-[10px] uppercase tracking-wide text-[var(--text-muted)] ml-2">
            Carpeta
          </span>
        )}
      </button>
      {children.length > 0 && (
        <div class="mt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function VaultTree({
  nodes,
  selectedId,
  onSelect,
  onCreateFolder,
  onCreateFile,
}: VaultTreeProps) {
  const rootNodes = nodes.filter((n) => n.parentId === null);
  const byParent = new Map<string | null, VaultNodeDto[]>();
  for (const n of nodes) {
    const key = n.parentId;
    const list = byParent.get(key) ?? [];
    list.push(n);
    byParent.set(key, list);
  }

  function renderSubtree(parentId: string | null, depth: number): ComponentChildren {
    const children = byParent.get(parentId) ?? [];
    return children
      .sort((a, b) => {
        if (a.type !== b.type) {
          // Carpetas primero
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={depth}
          isSelected={selectedId === node.id}
          onSelect={onSelect}
          children={renderSubtree(node.id, depth + 1) as VaultNodeDto[] as any}
        />
      ));
  }

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-sm font-semibold text-[var(--text-primary)]">Estructura</h2>
          <p class="text-xs text-[var(--text-muted)]">Carpetas y archivos en la Bodega</p>
        </div>
        <div class="flex gap-2">
          {onCreateFolder && (
            <Button
              type="button"
              variant="ghost"
              class="px-2 py-1 text-xs"
              onClick={() => onCreateFolder(selectedId)}
            >
              Nueva carpeta
            </Button>
          )}
          {onCreateFile && (
            <Button
              type="button"
              variant="ghost"
              class="px-2 py-1 text-xs"
              onClick={() => onCreateFile(selectedId)}
            >
              Nuevo archivo
            </Button>
          )}
        </div>
      </div>
      <div class="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2 overflow-auto">
        {rootNodes.length === 0 ? (
          <p class="text-xs text-[var(--text-muted)] py-4 text-center">
            No hay nodos en el bodega todavía.
          </p>
        ) : (
          <div class="flex flex-col gap-0.5">
            {renderSubtree(null, 0)}
          </div>
        )}
      </div>
    </div>
  );
}

