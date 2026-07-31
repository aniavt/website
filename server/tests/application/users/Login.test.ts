import { describe, expect, test } from "bun:test";
import { LoginUseCase } from "@application/users/use-cases/Login";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeSecureHasher } from "../../doubles/FakeSecureHasher";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("LoginUseCase", () => {
  test("happy path", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ username: "alice", passwordHash: "hash:secret" }));
    const uc = new LoginUseCase(users, new FakeSecureHasher());
    const result = await uc.execute({ username: "alice", password: "secret" });
    const dto = expectOk(result);
    expect(dto.username).toBe("alice");
  });

  test("unknown user and wrong password return the same error (no enumeration)", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ username: "alice", passwordHash: "hash:secret" }));
    const uc = new LoginUseCase(users, new FakeSecureHasher());

    const missing = await uc.execute({ username: "nobody", password: "secret" });
    const wrong = await uc.execute({ username: "alice", password: "wrong" });

    expectErr(missing, "password_verify_failed");
    expectErr(wrong, "password_verify_failed");
    expect(missing.error).toBe(wrong.error);
  });
});
