import Fastify from "fastify";
import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { LoginUseCase } from "@application/users/use-cases/Login";
import { CreateUserUseCase } from "@application/users/use-cases/CreateUser";
import { UpdatePasswordUseCase } from "@application/users/use-cases/UpdatePassword";
import { IncrementSessionVersionUseCase } from "@application/users/use-cases/IncrementSessionVersion";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import { registerUserAuthRoutes } from "@infrastructure/http/fastify/routes/user/auth";
import { registerDomainErrorHandler, sendUserError } from "@infrastructure/http/fastify/errors";
import { InMemoryUserRepository } from "../doubles/InMemoryUserRepository";
import { FakeSecureHasher } from "../doubles/FakeSecureHasher";
import { FakeIdGenerator } from "../doubles/FakeIdGenerator";

export async function buildAuthTestApp(users = new InMemoryUserRepository()) {
  const hasher = new FakeSecureHasher();
  const ids = new FakeIdGenerator();

  const userUseCases = {
    login: new LoginUseCase(users, hasher),
    create: new CreateUserUseCase(users, hasher, ids),
    updatePassword: new UpdatePasswordUseCase(users, hasher),
    incrementSessionVersion: new IncrementSessionVersionUseCase(users),
  } as unknown as IUserUseCases;

  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerDomainErrorHandler(app);
  await app.register(cookie);
  app.decorateRequest("user", null);
  app.decorateRequest("userEntity", null);

  const prefixUrl = (path: string) => path;
  registerUserAuthRoutes(app, prefixUrl, { userUseCases, userRepository: users });

  // Smoke route for domain error status mapping (403 vs 401)
  app.get("/__test/error/:code", async (request, reply) => {
    const code = (request.params as { code: string }).code;
    return sendUserError(reply, code as "user_not_authorized" | "password_verify_failed");
  });

  await app.ready();
  return { app, users, hasher };
}
