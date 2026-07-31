import { describe, test } from "bun:test";
import { VerifyPasswordUseCase } from "@application/users/use-cases/VerifyPassword";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeSecureHasher } from "../../doubles/FakeSecureHasher";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("VerifyPasswordUseCase", () => {
  test("happy path", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "u1", passwordHash: "hash:secret" }));

    const uc = new VerifyPasswordUseCase(users, new FakeSecureHasher());
    expectOk(await uc.execute("u1", "secret"));
  });

  test("user_not_found", async () => {
    const uc = new VerifyPasswordUseCase(new InMemoryUserRepository(), new FakeSecureHasher());
    expectErr(await uc.execute("missing", "secret"), "user_not_found");
  });

  test("password_verify_failed", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "u1", passwordHash: "hash:secret" }));

    const uc = new VerifyPasswordUseCase(users, new FakeSecureHasher());
    expectErr(await uc.execute("u1", "wrong"), "password_verify_failed");
  });
});
