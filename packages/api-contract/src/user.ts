import type { UserPermissions } from "@ania/domain-shared/permissions";

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
