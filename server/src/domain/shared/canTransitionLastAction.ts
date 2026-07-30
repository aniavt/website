export type SoftDeleteLastAction = "created" | "updated" | "deleted" | "restore";

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
