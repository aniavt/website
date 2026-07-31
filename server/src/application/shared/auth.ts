import type { UserEntity } from "@domain/entities/User";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { err, ok, type Result } from "@lib/result";

export async function resolveRequester(
  userRepository: UserRepository,
  requester: UserEntity | string | null,
): Promise<UserEntity | null> {
  if (requester === null) return null;
  if (typeof requester !== "string") return requester;
  return userRepository.findById(requester);
}

export async function assertPermission<const E>(
  userRepository: UserRepository,
  requester: UserEntity | string,
  permission: Parameters<UserEntity["hasPermission"]>[0],
  unauthorized: E,
): Promise<Result<UserEntity, E>> {
  const user = await resolveRequester(userRepository, requester);
  if (!user) return err(unauthorized);
  if (!user.hasPermission(permission)) return err(unauthorized);
  return ok(user);
}
