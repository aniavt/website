import { describe, expect, test } from "bun:test";
import { GetUserByUsernameUseCase } from "@application/users/use-cases/GetUserByUsername";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetUserByUsernameUseCase", () => {
  test("happy path", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "u1", username: "Alice" }));

    const uc = new GetUserByUsernameUseCase(users);
    const dto = expectOk(await uc.execute("alice"));
    expect(dto.username).toBe("Alice");
  });

  test("user_not_found", async () => {
    const uc = new GetUserByUsernameUseCase(new InMemoryUserRepository());
    expectErr(await uc.execute("nobody"), "user_not_found");
  });
});
