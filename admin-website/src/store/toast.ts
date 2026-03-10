import { signal } from "@preact/signals";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let nextId = 0;

export const toasts = signal<Toast[]>([]);

export function addToast(message: string, type: Toast["type"] = "info") {
  const id = nextId++;
  toasts.value = [...toasts.value, { id, message, type }];
  setTimeout(() => removeToast(id), 4000);
}

export function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}
