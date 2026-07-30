export const SOFT_DELETE_LAST_ACTIONS = ["created", "updated", "deleted", "restore"] as const;
export type SoftDeleteLastAction = (typeof SOFT_DELETE_LAST_ACTIONS)[number];
