export type PermissionNamespace =
  | "meta"
  | "user"
  | "faq"
  | "weekly_schedule"
  | "vault"
  | "anime"
  | "navItems";

export interface UserPermissions {
  readonly meta: string[];
  readonly user: string[];
  readonly faq: string[];
  readonly weekly_schedule: string[];
  readonly vault: string[];
  readonly anime: string[];
  readonly navItems: string[];
}

export interface UserDto {
  readonly id: string;
  readonly username: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isActive: boolean;
  readonly sessionVersion: number;
  readonly permissions: UserPermissions;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
}
