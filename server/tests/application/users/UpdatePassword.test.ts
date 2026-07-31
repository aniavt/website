import { describe, expect, test } from "bun:test";
import { UpdatePasswordUseCase } from "@application/users/use-cases/UpdatePassword";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeSecureHasher } from "../../doubles/FakeSecureHasher";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("UpdatePasswordUseCase", () => {
  test("happy path updates password and increments session version", async () => {
    const users = new InMemoryUserRepository();
    const user = createUser({ id: "u1", passwordHash: "hash:old", sessionVersion: 1 });
    await users.save(user);

    const uc = new UpdatePasswordUseCase(users, new FakeSecureHasher());
    expectOk(await uc.execute("u1", "newpass"));

    const saved = await users.findById("u1");
    expect(saved?.passwordHash).toBe("hash:newpass");
    expect(saved?.sessionVersion).toBe(2);
  });

  test("user_not_found", async () => {
    const uc = new UpdatePasswordUseCase(new InMemoryUserRepository(), new FakeSecureHasher());
    expectErr(await uc.execute("missing", "newpass"), "user_not_found");
  });
});
