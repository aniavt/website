import { z } from "zod";
import { type UserPermissions, PERMISSION_NAMESPACES } from "@ania/domain-shared/permissions";
import { nonEmptyMax } from "./zod-helpers";

export interface UserDto {
  readonly id: string;
  readonly username: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isActive: boolean;
  readonly sessionVersion: number;
  readonly permissions: UserPermissions;
}

export const LoginRequestSchema = z
  .object({
    username: z.string().min(3).max(20),
    password: z.string().min(1).max(100),
  })
  .strict();

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const CreateUserInputSchema = z
  .object({
    username: z.string().min(3).max(20),
    password: z.string().min(8).max(100),
  })
  .strict();

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdatePasswordInputSchema = z
  .object({
    password: z.string().min(8).max(100),
  })
  .strict();

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordInputSchema>;

export const ManagePermissionBodySchema = z
  .object({
    namespace: z.enum(PERMISSION_NAMESPACES),
    permission: nonEmptyMax(100),
  })
  .strict();

export type ManagePermissionBody = z.infer<typeof ManagePermissionBodySchema>;
