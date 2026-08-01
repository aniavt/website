import type { SoftDeleteLastAction } from "@ania/domain-shared/soft-delete";

export type { SoftDeleteLastAction };

export function canTransitionLastAction(
  from: SoftDeleteLastAction,
  to: SoftDeleteLastAction,
): boolean {
  switch (from) {
    case "created":
    case "updated":
    case "restore":
      return to === "updated" || to === "deleted";
    case "deleted":
      return to === "restore";
    default:
      return false;
  }
}
