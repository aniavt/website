import { describe, expect, test } from "bun:test";
import { IncrementSessionVersionUseCase } from "@application/users/use-cases/IncrementSessionVersion";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("IncrementSessionVersionUseCase", () => {
  test("happy path increments session version", async () => {
    const users = new InMemoryUserRepository();
    const user = createUser({ id: "u1", sessionVersion: 3 });
    await users.save(user);

    const uc = new IncrementSessionVersionUseCase(users);
    expectOk(await uc.execute("u1"));

    const saved = await users.findById("u1");
    expect(saved?.sessionVersion).toBe(4);
  });

  test("user_not_found", async () => {
    const uc = new IncrementSessionVersionUseCase(new InMemoryUserRepository());
    expectErr(await uc.execute("missing"), "user_not_found");
  });
});
