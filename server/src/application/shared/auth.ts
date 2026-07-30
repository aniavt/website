import type { UserEntity } from "@domain/entities/User";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { err, ok, type Result } from "@lib/result";

export async function assertPermission<const E>(
  userRepository: UserRepository,
  requesterId: string,
  permission: Parameters<UserEntity["hasPermission"]>[0],
  unauthorized: E,
): Promise<Result<UserEntity, E>> {
  const requester = await userRepository.findById(requesterId);
  if (!requester) return err(unauthorized);
  if (!requester.hasPermission(permission)) return err(unauthorized);
  return ok(requester);
}
